import { z } from "zod";

const email = z
  .string({ error: "E-posta zorunlu." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Geçerli bir e-posta adresi girin."));

const newPassword = z
  .string({ error: "Şifre zorunlu." })
  .min(8, "Şifre en az 8 karakter olmalı.")
  // bcrypt 72 byte'tan uzun şifrelerin geri kalanını yok sayar
  .refine((p) => Buffer.byteLength(p, "utf8") <= 72, "Şifre çok uzun.");

const token = (missing: string) => z.string({ error: missing }).min(1, missing);

export const registerSchema = z.object({
  email,
  password: newPassword,
  name: z
    .string({ error: "Ad soyad zorunlu." })
    .trim()
    .min(1, "Ad soyad boş olamaz.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
  acceptedTerms: z.literal(true, {
    error: "Devam etmek için Kullanım Şartları ve Gizlilik Politikası'nı kabul etmelisiniz.",
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Şifre zorunlu." }).min(1, "Şifre zorunlu."),
});

export const verifyEmailSchema = z.object({ token: token("Doğrulama bağlantısı geçersiz.") });

export const emailOnlySchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: token("Şifre sıfırlama bağlantısı geçersiz."),
  password: newPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
