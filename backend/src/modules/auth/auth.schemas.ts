import { z } from "zod";

const email = z
  .string({ error: "E-posta zorunlu." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta adresi girin."));

export const registerSchema = z.object({
  email,
  password: z
    .string({ error: "Şifre zorunlu." })
    .min(8, "Şifre en az 8 karakter olmalı.")
    // bcrypt 72 byte'tan uzun şifrelerin geri kalanını yok sayar
    .refine((p) => Buffer.byteLength(p, "utf8") <= 72, "Şifre çok uzun."),
  name: z
    .string({ error: "Ad soyad zorunlu." })
    .trim()
    .min(1, "Ad soyad boş olamaz.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Şifre zorunlu." }).min(1, "Şifre zorunlu."),
});

export const verifyEmailSchema = z.object({
  token: z.string({ error: "Doğrulama token'ı eksik." }).min(1, "Doğrulama token'ı eksik."),
});

export const resendVerificationSchema = z.object({ email });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
