import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  // Bu sunucunun dışarıdan erişilen adresi; /static altındaki görsellerin tam URL'i bununla kurulur
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:8000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunlu"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET en az 32 karakter olmalı"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  // Rotate edilmiş refresh token'ın tekrar kabul edildiği süre (iki sekme aynı anda yenilerse)
  REFRESH_GRACE_SECONDS: z.coerce.number().int().nonnegative().default(30),
  // Kayıtta onaylanan Kullanım Şartları / Gizlilik Politikası metninin sürümü
  TERMS_VERSION: z.string().min(1).default("1.0"),
  // Google ile giriş (boşsa /auth/google hata sayfasına yönlendirir)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:8000/api/auth/google/callback"),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("E-Commerce <no-reply@example.com>"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Geçersiz ortam değişkenleri (.env dosyasını kontrol et):");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
