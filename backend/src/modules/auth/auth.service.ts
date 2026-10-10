import { env } from "../../config/env.js";
import { pool, withTransaction, type DbClient } from "../../db/pool.js";
import { HttpError } from "../../lib/httpError.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../lib/mailer.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { generateOpaqueToken, hashToken, signAccessToken } from "../../lib/tokens.js";
import {
  findUserByEmail,
  findUserById,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "../users/users.repository.js";
import type { ChangePasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "./auth.schemas.js";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

type RevokeReason = "rotated" | "logout" | "reuse" | "password_reset" | "password_change";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Tek kullanımlık token üretir; aynı kullanıcının önceki kullanılmamış token'larını siler. */
async function createOneTimeToken(
  table: "email_verification_tokens" | "password_reset_tokens",
  userId: string,
  ttlMs: number,
  db: DbClient,
): Promise<string> {
  await db.query(`DELETE FROM ${table} WHERE user_id = $1 AND used_at IS NULL`, [userId]);
  const token = generateOpaqueToken();
  await db.query(`INSERT INTO ${table} (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
    userId,
    hashToken(token),
    new Date(Date.now() + ttlMs),
  ]);
  return token;
}

const createVerificationToken = (userId: string, db: DbClient) =>
  createOneTimeToken("email_verification_tokens", userId, env.EMAIL_VERIFICATION_TTL_HOURS * HOUR, db);

export async function issueTokens(user: UserRow, db: DbClient = pool): Promise<AuthResult> {
  const refreshToken = generateOpaqueToken();
  await db.query("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [
    user.id,
    hashToken(refreshToken),
    new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY),
  ]);
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
    user: toPublicUser(user),
  };
}

async function revokeAllSessions(userId: string, reason: RevokeReason, db: DbClient) {
  await db.query(
    "UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = $2 WHERE user_id = $1 AND revoked_at IS NULL",
    [userId, reason],
  );
}

async function sendSafely(kind: string, send: () => Promise<void>) {
  try {
    await send();
  } catch (err) {
    // E-posta gönderilemese bile kullanıcı yeni bağlantı isteyebilir; isteği başarısız sayma.
    console.error(`${kind} e-postası gönderilemedi:`, err);
  }
}

// ---------------------------------------------------------------------------
// Register / doğrulama
// ---------------------------------------------------------------------------

export async function register(input: RegisterInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);

  const token = await withTransaction(async (db) => {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, terms_accepted_at, terms_version)
       VALUES ($1, $2, $3, now(), $4)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [input.email, passwordHash, input.name, env.TERMS_VERSION],
    );
    const userId = rows[0]?.id;
    if (!userId) return null;
    return createVerificationToken(userId, db);
  });

  if (!token) {
    throw new HttpError(409, "Bu e-posta zaten kayıtlı.", "EMAIL_TAKEN");
  }
  await sendSafely("Doğrulama", () => sendVerificationEmail(input.email, token));
}

export async function verifyEmail(token: string): Promise<{ alreadyVerified: boolean }> {
  return withTransaction(async (db) => {
    const { rows } = await db.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
      email_verified: boolean;
    }>(
      `SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email_verified
         FROM email_verification_tokens t
         JOIN users u ON u.id = t.user_id
        WHERE t.token_hash = $1
        FOR UPDATE OF t`,
      [hashToken(token)],
    );
    const row = rows[0];

    // Link iki kez tıklandıysa kullanıcıyı hata ile korkutma.
    if (row?.used_at && row.email_verified) return { alreadyVerified: true };

    if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
      throw new HttpError(
        400,
        "Doğrulama linki geçersiz veya süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin.",
        "INVALID_VERIFICATION_TOKEN",
      );
    }

    await db.query("UPDATE email_verification_tokens SET used_at = now() WHERE id = $1", [row.id]);
    await db.query("UPDATE users SET email_verified = TRUE, updated_at = now() WHERE id = $1", [row.user_id]);
    return { alreadyVerified: false };
  });
}

export async function resendVerification(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  // Hesap yoksa veya zaten doğrulanmışsa sessizce çık: yanıt her durumda aynı.
  if (!user || user.email_verified) return;
  const token = await withTransaction((db) => createVerificationToken(user.id, db));
  await sendSafely("Doğrulama", () => sendVerificationEmail(user.email, token));
}

// ---------------------------------------------------------------------------
// Şifre sıfırlama
// ---------------------------------------------------------------------------

export async function forgotPassword(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  // Hesap yoksa sessizce çık: yanıt her durumda aynı.
  // Google ile açılmış (şifresiz) hesaplar da bu yolla şifre belirleyebilir.
  if (!user) return;
  const token = await withTransaction((db) =>
    createOneTimeToken("password_reset_tokens", user.id, env.PASSWORD_RESET_TTL_MINUTES * MINUTE, db),
  );
  await sendSafely("Şifre sıfırlama", () => sendPasswordResetEmail(user.email, token));
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);

  await withTransaction(async (db) => {
    const { rows } = await db.query<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE",
      [hashToken(input.token)],
    );
    const row = rows[0];
    if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
      throw new HttpError(
        400,
        "Şifre sıfırlama bağlantısı geçersiz, süresi dolmuş veya daha önce kullanılmış. Lütfen yeni bir bağlantı isteyin.",
        "INVALID_RESET_TOKEN",
      );
    }

    await db.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [row.id]);
    // Bağlantıya e-postadan ulaştığı için e-posta sahipliği de kanıtlanmış olur.
    await db.query(
      "UPDATE users SET password_hash = $2, email_verified = TRUE, updated_at = now() WHERE id = $1",
      [row.user_id, passwordHash],
    );
    // Şifre değişti: açık tüm oturumları kapat.
    await revokeAllSessions(row.user_id, "password_reset", db);
  });
}

// ---------------------------------------------------------------------------
// Şifre değiştirme (giriş yapmış kullanıcı)
// ---------------------------------------------------------------------------

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  currentRefreshToken: string | undefined,
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "Kullanıcı bulunamadı.", "NOT_FOUND");

  // Google ile açılmış şifresiz hesap: mevcut şifre olmadan şifre belirlemeye izin verme.
  // Aksi halde çalınmış bir access token ile hesaba kalıcı erişim sağlanabilir.
  if (!user.password_hash) {
    throw new HttpError(
      400,
      "Hesabınız için henüz bir şifre belirlenmemiş. 'Şifremi unuttum' ile şifre oluşturabilirsiniz.",
      "PASSWORD_NOT_SET",
    );
  }
  // 401 değil 400: frontend 401'de refresh deneyip oturumu kapatıyor.
  if (!(await verifyPassword(input.currentPassword, user.password_hash))) {
    throw new HttpError(400, "Mevcut şifreniz hatalı.", "INVALID_CURRENT_PASSWORD");
  }
  if (input.newPassword === input.currentPassword) {
    throw new HttpError(400, "Yeni şifre mevcut şifrenizle aynı olamaz.", "SAME_PASSWORD");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await withTransaction(async (db) => {
    // Kontrol ile güncelleme arasında şifre başka bir istekle değiştiyse güncelleme.
    const { rowCount } = await db.query(
      "UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1 AND password_hash = $3",
      [user.id, passwordHash, user.password_hash],
    );
    if (!rowCount) throw new HttpError(400, "Mevcut şifreniz hatalı.", "INVALID_CURRENT_PASSWORD");

    // Diğer cihazlardaki oturumları kapat; bu isteğin çerezindeki oturum açık kalır.
    // Çerez yoksa hash hiçbir satırla eşleşmez ve tüm oturumlar kapanır.
    await db.query(
      `UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'password_change'
        WHERE user_id = $1 AND revoked_at IS NULL AND token_hash <> $2`,
      [user.id, currentRefreshToken ? hashToken(currentRefreshToken) : ""],
    );
  });
}

// ---------------------------------------------------------------------------
// Login / refresh / logout
// ---------------------------------------------------------------------------

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  // Google ile açılmış şifresiz hesaplarda password_hash null'dır; sonuç yine "hatalı" olur.
  const passwordOk = await verifyPassword(input.password, user?.password_hash);

  // Önce şifre: yanlışsa hesabın var olup olmadığı ya da doğrulanıp doğrulanmadığı belli olmasın.
  if (!user || !passwordOk) {
    throw new HttpError(401, "E-posta veya şifre hatalı.", "INVALID_CREDENTIALS");
  }
  if (!user.email_verified) {
    throw new HttpError(
      403,
      "E-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin veya yeni doğrulama e-postası isteyin.",
      "EMAIL_NOT_VERIFIED",
    );
  }
  return issueTokens(user);
}

const invalidSession = () => new HttpError(401, "Oturum geçersiz. Lütfen tekrar giriş yapın.", "INVALID_REFRESH_TOKEN");

export async function refresh(rawToken: string | undefined): Promise<AuthResult> {
  // Çerez yoksa veritabanına hiç gitmeden 401 (giriş yapmamış ziyaretçide her sayfa açılışında çağrılır).
  if (!rawToken) throw invalidSession();

  const outcome = await withTransaction(async (db) => {
    const { rows } = await db.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      revoked_at: Date | null;
      revoke_reason: RevokeReason | null;
    }>(
      "SELECT id, user_id, expires_at, revoked_at, revoke_reason FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE",
      [hashToken(rawToken)],
    );
    const stored = rows[0];
    if (!stored || stored.expires_at.getTime() < Date.now()) return null;

    if (stored.revoked_at) {
      const withinGrace =
        stored.revoke_reason === "rotated" &&
        Date.now() - stored.revoked_at.getTime() < env.REFRESH_GRACE_SECONDS * 1000;

      if (!withinGrace) {
        if (stored.revoke_reason === "rotated") {
          // Rotate edilmiş eski bir token tolerans süresinden sonra tekrar geldi: çalınmış olabilir.
          // Güvenlik için bu kullanıcının tüm oturumlarını kapat.
          await revokeAllSessions(stored.user_id, "reuse", db);
        }
        return null;
      }
      // Tolerans süresi içinde: iki sekme aynı anda yeniledi. Kullanıcıyı çıkarmadan yeni bir token ver.
    }

    const user = await findUserById(stored.user_id, db);
    if (!user || !user.email_verified) return null;

    if (!stored.revoked_at) {
      // Rotation: eski token iptal, yenisi verilir.
      await db.query("UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'rotated' WHERE id = $1", [
        stored.id,
      ]);
    }
    return issueTokens(user, db);
  });

  if (!outcome) throw invalidSession();
  return outcome;
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'logout' WHERE token_hash = $1 AND revoked_at IS NULL",
    [hashToken(rawToken)],
  );
}
