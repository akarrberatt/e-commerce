import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

const message = (text: string) => ({ message: text, code: "RATE_LIMITED" });

function limiter(windowMinutes: number, limit: number, text: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: message(text),
    skip: () => env.NODE_ENV === "test",
  });
}

export const loginLimiter = limiter(15, 10, "Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.");
export const registerLimiter = limiter(60, 10, "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.");
export const resendLimiter = limiter(15, 3, "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin.");
