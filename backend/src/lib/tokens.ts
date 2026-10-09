import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface AccessTokenPayload {
  sub: string; // kullanıcı id
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
  if (typeof decoded === "string" || typeof decoded.sub !== "string") {
    throw new Error("Geçersiz token içeriği");
  }
  return { sub: decoded.sub, role: decoded.role as UserRole };
}

/** Refresh ve doğrulama token'ları için tahmin edilemez rastgele değer (opaque token). */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Token'lar veritabanında düz değil, SHA-256 hash'i olarak saklanır. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
