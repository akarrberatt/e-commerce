import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";
import { verifyAccessToken, type AccessTokenPayload, type UserRole } from "../lib/tokens.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

/** `Authorization: Bearer <access token>` header'ını doğrular. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Giriş yapmanız gerekiyor.", "UNAUTHENTICATED");
  }
  try {
    req.auth = verifyAccessToken(header.slice(7));
  } catch {
    throw new HttpError(401, "Oturum süresi doldu veya geçersiz.", "INVALID_TOKEN");
  }
  next();
}

/**
 * Herkese açık ama token gelirse kişiye özel alan dolduran uçlar için.
 * Başlık yoksa anonim devam eder; başlık varsa token geçerli olmak zorundadır
 * (aksi hâlde 401 — frontend refresh dener, eski token'la sessizce anonim sonuç dönülmez).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header === undefined) {
    next();
    return;
  }
  try {
    if (!header.startsWith("Bearer ")) throw new Error("Bearer bekleniyor");
    req.auth = verifyAccessToken(header.slice(7));
  } catch {
    throw new HttpError(401, "Oturum süresi doldu veya geçersiz.", "INVALID_TOKEN");
  }
  next();
}

/** requireAuth'tan sonra kullanılır: belirli rollere izin verir. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new HttpError(403, "Bu işlem için yetkiniz yok.", "FORBIDDEN");
    }
    next();
  };
}
