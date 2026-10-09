import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import * as authService from "./auth.service.js";

export const REFRESH_COOKIE = "refresh_token";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  // Cookie sadece /api/auth uçlarına gönderilir, diğer API isteklerinde taşınmaz.
  path: "/api/auth",
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...refreshCookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

function readRefreshCookie(req: Request): string | undefined {
  const value = req.cookies?.[REFRESH_COOKIE];
  return typeof value === "string" ? value : undefined;
}

export async function register(req: Request, res: Response) {
  await authService.register(req.body);
  res.status(201).json({
    message: "Kayıt başarılı. Lütfen e-postanıza gönderilen bağlantıyla hesabınızı doğrulayın.",
  });
}

export async function verifyEmail(req: Request, res: Response) {
  const { alreadyVerified } = await authService.verifyEmail(req.body.token);
  res.json({
    message: alreadyVerified
      ? "E-posta adresiniz zaten doğrulanmış. Giriş yapabilirsiniz."
      : "E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz.",
  });
}

export async function resendVerification(req: Request, res: Response) {
  await authService.resendVerification(req.body.email);
  res.json({
    message: "Bu e-posta ile doğrulanmamış bir hesap varsa, yeni doğrulama bağlantısı gönderildi.",
  });
}

export async function login(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ token: accessToken, user });
}

export async function refresh(req: Request, res: Response) {
  try {
    const { accessToken, refreshToken, user } = await authService.refresh(readRefreshCookie(req));
    setRefreshCookie(res, refreshToken);
    res.json({ token: accessToken, user });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout(readRefreshCookie(req));
  clearRefreshCookie(res);
  res.status(204).end();
}
