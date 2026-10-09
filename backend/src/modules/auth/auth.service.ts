import { env } from "../../config/env.js";
import { pool, withTransaction, type DbClient } from "../../db/pool.js";
import { HttpError } from "../../lib/httpError.js";
import { sendVerificationEmail } from "../../lib/mailer.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { generateOpaqueToken, hashToken, signAccessToken } from "../../lib/tokens.js";
import {
  findUserByEmail,
  findUserById,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "../users/users.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

async function createVerificationToken(userId: string, db: DbClient): Promise<string> {
  // Önceki kullanılmamış token'lar geçersiz olsun: her zaman sadece son gönderilen link çalışır.
  await db.query("DELETE FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL", [userId]);
  const token = generateOpaqueToken();
  await db.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashToken(token), new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * HOUR)],
  );
  return token;
}

async function issueTokens(user: UserRow, db: DbClient): Promise<AuthResult> {
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

async function sendVerificationSafely(email: string, token: string) {
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    // E-posta gönderilemese bile kullanıcı "tekrar gönder" ile yeni link isteyebilir.
    console.error("Doğrulama e-postası gönderilemedi:", err);
  }
}

// ---------------------------------------------------------------------------
// Register / doğrulama
// ---------------------------------------------------------------------------

export async function register(input: RegisterInput): Promise<void> {
  const passwordHash = await hashPassword(input.password);

  const result = await withTransaction(async (db) => {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [input.email, passwordHash, input.name],
    );
    const userId = rows[0]?.id;
    if (!userId) return null;
    return createVerificationToken(userId, db);
  });

  if (!result) {
    throw new HttpError(409, "Bu e-posta zaten kayıtlı.", "EMAIL_TAKEN");
  }
  await sendVerificationSafely(input.email, result);
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
  await sendVerificationSafely(user.email, token);
}

// ---------------------------------------------------------------------------
// Login / refresh / logout
// ---------------------------------------------------------------------------

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
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
  return issueTokens(user, pool);
}

const invalidSession = () => new HttpError(401, "Oturum geçersiz. Lütfen tekrar giriş yapın.", "INVALID_REFRESH_TOKEN");

export async function refresh(rawToken: string | undefined): Promise<AuthResult> {
  if (!rawToken) throw invalidSession();

  const outcome = await withTransaction(async (db) => {
    const { rows } = await db.query<{ id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
      "SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE",
      [hashToken(rawToken)],
    );
    const stored = rows[0];
    if (!stored) return { ok: false as const };

    if (stored.revoked_at) {
      // Daha önce kullanılmış (rotate edilmiş) bir token tekrar geldi: çalınmış olabilir.
      // Güvenlik için bu kullanıcının tüm oturumlarını kapat.
      await db.query("UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [
        stored.user_id,
      ]);
      return { ok: false as const };
    }
    if (stored.expires_at.getTime() < Date.now()) return { ok: false as const };

    const user = await findUserById(stored.user_id, db);
    if (!user || !user.email_verified) return { ok: false as const };

    // Rotation: eski token iptal, yenisi verilir.
    await db.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [stored.id]);
    return { ok: true as const, result: await issueTokens(user, db) };
  });

  if (!outcome.ok) throw invalidSession();
  return outcome.result;
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [
    hashToken(rawToken),
  ]);
}
