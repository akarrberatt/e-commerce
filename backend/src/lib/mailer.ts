import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail(mail: Mail): Promise<void> {
  if (!transporter) {
    // SMTP ayarlanmadıysa (geliştirme) e-postayı konsola yaz.
    console.log(`\n📧 [DEV MAIL] Kime: ${mail.to}\n   Konu: ${mail.subject}\n   ${mail.text}\n`);
    return;
  }
  await transporter.sendMail({ from: env.MAIL_FROM, ...mail });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail({
    to,
    subject: "E-posta adresini doğrula",
    text: `Hesabını aktifleştirmek için bu linke tıkla: ${link}\nLink ${env.EMAIL_VERIFICATION_TTL_HOURS} saat geçerlidir.`,
    html: `<p>Hesabını aktifleştirmek için aşağıdaki linke tıkla:</p>
<p><a href="${link}">E-postamı doğrula</a></p>
<p>Link ${env.EMAIL_VERIFICATION_TTL_HOURS} saat geçerlidir. Bu işlemi sen yapmadıysan bu e-postayı yok sayabilirsin.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const minutes = env.PASSWORD_RESET_TTL_MINUTES;
  await sendMail({
    to,
    subject: "Şifre sıfırlama",
    text: `Şifreni sıfırlamak için bu linke tıkla: ${link}\nLink ${minutes} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`,
    html: `<p>Şifreni sıfırlamak için aşağıdaki linke tıkla:</p>
<p><a href="${link}">Şifremi sıfırla</a></p>
<p>Link ${minutes} dakika geçerlidir ve yalnızca bir kez kullanılabilir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.</p>`,
  });
}
