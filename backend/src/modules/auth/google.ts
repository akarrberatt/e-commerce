/**
 * Google ile giriş (OAuth 2.0 Authorization Code + PKCE).
 *
 * Akış:
 *  1. Frontend tarayıcıyı GET /api/auth/google adresine götürür.
 *  2. Biz state + PKCE üretip kısa ömürlü bir çerezde saklar, kullanıcıyı Google'a yönlendiririz.
 *  3. Google, GOOGLE_REDIRECT_URI'ye (/api/auth/google/callback) code ile döner.
 *  4. Code'u token'a çevirir, Google'dan kullanıcı bilgisini alır, kullanıcıyı bulur/oluştururuz.
 *  5. Refresh çerezini verip FRONTEND_URL/auth/callback adresine yönlendiririz.
 *     Hata olursa aynı adrese ?error=google ile, çerez vermeden yönlendiririz.
 */
import crypto from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import { withTransaction } from "../../db/pool.js";
import type { UserRow } from "../users/users.repository.js";
import { setRefreshCookie } from "./auth.controller.js";
import { issueTokens } from "./auth.service.js";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const STATE_COOKIE = "google_oauth";
const stateCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax", // Google'dan dönüş üst düzey bir GET yönlendirmesi olduğu için Lax yeterli
  path: "/api/auth/google",
};

const callbackUrl = (error?: boolean) => `${env.FRONTEND_URL}/auth/callback${error ? "?error=google" : ""}`;

const base64url = (buf: Buffer) => buf.toString("base64url");

export function isGoogleConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

// ---------------------------------------------------------------------------
// GET /api/auth/google
// ---------------------------------------------------------------------------

export function startGoogleLogin(_req: Request, res: Response) {
  if (!isGoogleConfigured()) {
    console.warn("Google ile giriş denendi ama GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET ayarlı değil.");
    res.redirect(302, callbackUrl(true));
    return;
  }

  const state = base64url(crypto.randomBytes(24));
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());

  res.cookie(STATE_COOKIE, JSON.stringify({ state, verifier }), {
    ...stateCookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  res.redirect(302, `${AUTH_URL}?${params}`);
}

// ---------------------------------------------------------------------------
// GET /api/auth/google/callback
// ---------------------------------------------------------------------------

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
}

export async function handleGoogleCallback(req: Request, res: Response) {
  const saved = readStateCookie(req);
  res.clearCookie(STATE_COOKIE, stateCookieOptions);

  try {
    const { code, state, error } = req.query;
    if (error) throw new Error(`Google hata döndü: ${String(error)}`);
    if (!saved || typeof code !== "string" || typeof state !== "string" || state !== saved.state) {
      throw new Error("Geçersiz veya eksik state/code");
    }

    const profile = await fetchGoogleProfile(code, saved.verifier);
    if (!profile.email || !profile.email_verified) {
      throw new Error("Google e-postası doğrulanmamış");
    }

    const user = await findOrCreateGoogleUser(profile);
    const { refreshToken } = await issueTokens(user);
    setRefreshCookie(res, refreshToken);
    res.redirect(302, callbackUrl());
  } catch (err) {
    console.error("Google ile giriş başarısız:", err instanceof Error ? err.message : err);
    res.redirect(302, callbackUrl(true));
  }
}

function readStateCookie(req: Request): { state: string; verifier: string } | null {
  try {
    const parsed = JSON.parse(req.cookies?.[STATE_COOKIE] ?? "");
    return typeof parsed?.state === "string" && typeof parsed?.verifier === "string" ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchGoogleProfile(code: string, verifier: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token değişimi başarısız: ${tokenRes.status} ${await tokenRes.text()}`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Google yanıtında access_token yok");

  // Kullanıcı bilgisini doğrudan Google'dan (TLS üzerinden, az önce aldığımız token ile) alıyoruz.
  const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) throw new Error(`Kullanıcı bilgisi alınamadı: ${infoRes.status}`);
  return (await infoRes.json()) as GoogleProfile;
}

/**
 * Hesap eşleştirme kuralları:
 *  - Bu Google hesabı daha önce bağlandıysa o kullanıcı.
 *  - Aynı e-postayla şifreli bir hesap varsa Google hesabı ona bağlanır (Google e-postayı doğruladı).
 *    O hesap daha önce doğrulanmamışsa şifresi silinir: başkası bu e-postayla kayıt olup şifre
 *    belirlemiş olabilir; gerçek sahibi gerekirse "şifremi unuttum" ile yeni şifre belirler.
 *  - Hiç hesap yoksa şifresiz, doğrulanmış yeni bir hesap açılır.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserRow> {
  const email = profile.email.trim().toLowerCase();
  const name = profile.name?.trim() || email.split("@")[0]!;

  return withTransaction(async (db) => {
    const byGoogle = await db.query<UserRow>("SELECT * FROM users WHERE google_id = $1", [profile.sub]);
    if (byGoogle.rows[0]) return byGoogle.rows[0];

    const byEmail = await db.query<UserRow>("SELECT * FROM users WHERE email = $1 FOR UPDATE", [email]);
    const existing = byEmail.rows[0];
    if (existing) {
      const { rows } = await db.query<UserRow>(
        `UPDATE users
            SET google_id = $2,
                password_hash = CASE WHEN email_verified THEN password_hash ELSE NULL END,
                name = CASE WHEN email_verified THEN name ELSE $3 END,
                email_verified = TRUE,
                updated_at = now()
          WHERE id = $1
        RETURNING *`,
        [existing.id, profile.sub, name],
      );
      if (!existing.email_verified) {
        await db.query(
          "UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'reuse' WHERE user_id = $1 AND revoked_at IS NULL",
          [existing.id],
        );
      }
      return rows[0]!;
    }

    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (email, name, google_id, email_verified, password_hash)
       VALUES ($1, $2, $3, TRUE, NULL)
       RETURNING *`,
      [email, name, profile.sub],
    );
    return rows[0]!;
  });
}
