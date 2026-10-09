# E-Commerce Backend

Express + TypeScript + PostgreSQL. Şu an auth modülü hazır: kayıt, e-posta doğrulama, giriş, refresh token rotation ve çıkış.

## Kurulum

1. **Bağımlılıklar**
   ```bash
   npm install
   ```

2. **PostgreSQL ve sahte e-posta sunucusu**
   Docker varsa:
   ```bash
   docker compose up -d
   ```
   Bu, PostgreSQL'i (5432) ve Mailpit'i başlatır. Gönderilen e-postaları http://localhost:8025 adresinde görürsün.
   Docker yoksa PostgreSQL'i kendin kur ve `ecommerce` adında bir veritabanı oluştur.

3. **Ortam değişkenleri**
   `.env.example` dosyasını `.env` olarak kopyala ve `JWT_ACCESS_SECRET` değerini değiştir:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Mailpit kullanıyorsan `SMTP_HOST=localhost` yap. Boş bırakırsan doğrulama linki terminale yazdırılır.

4. **Tabloları oluştur**
   ```bash
   npm run db:migrate
   ```

5. **Çalıştır**
   ```bash
   npm run dev
   ```
   API: http://localhost:8000/api

## Endpoint'ler

| Metot | Yol | Gövde | Başarılı yanıt | Hatalar |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `201 { message }` | `400` doğrulama, `409 EMAIL_TAKEN` |
| POST | `/api/auth/verify-email` | `{ token }` | `200 { message }` (iki kez tıklanırsa da 200) | `400 INVALID_VERIFICATION_TOKEN` |
| POST | `/api/auth/resend-verification` | `{ email }` | `200 { message }` (her durumda aynı) | `429` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { token, user }` + `Set-Cookie: refresh_token` | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `429` |
| POST | `/api/auth/refresh` | (cookie) | `200 { token, user }` + yeni cookie | `401 INVALID_REFRESH_TOKEN` |
| POST | `/api/auth/logout` | (cookie) | `204` | |
| GET | `/api/users/me` | `Authorization: Bearer <token>` | `200 { user }` | `401` |

Base URL: `http://localhost:8000/api`. `user` nesnesi: `{ id, name, email, role, emailVerified, createdAt }`.

Kurallar: şifre en az 8 karakter, ad soyad boş olamaz, e-posta büyük/küçük harf duyarsız (küçük harfe çevrilerek saklanır). Korumalı uçlar geçersiz/süresi dolmuş token'a `401` döner.

Tüm hatalar `{ message, code }` biçimindedir. Frontend `message`'ı kullanıcıya gösterebilir, `code` ile dallanabilir (ör. `EMAIL_NOT_VERIFIED` gelince "tekrar gönder" butonu).

Doğrulama e-postasındaki link `FRONTEND_URL/verify-email?token=...` adresine gider; frontend bu sayfada token'ı `POST /api/auth/verify-email` ile göndermelidir.

## Güvenlik kararları

- Şifreler bcrypt ile hash'lenir. Refresh ve doğrulama token'ları veritabanında SHA-256 hash'i olarak saklanır.
- Access token: JWT, 15 dk. Refresh token: opaque, 7 gün, `HttpOnly` + `SameSite=Lax` cookie, `Path=/api/auth`.
- **Refresh rotation:** her refresh'te eski token iptal edilir. İptal edilmiş bir token tekrar kullanılırsa (çalınma şüphesi) kullanıcının tüm oturumları kapatılır.
  Bu yüzden frontend aynı anda birden fazla refresh isteği atmamalı; tek istek atıp diğerleri onu beklemeli.
- Login'de önce şifre kontrol edilir; şifre yanlışsa hesabın var olup olmadığı ya da doğrulanıp doğrulanmadığı belli olmaz.
- Login, register ve resend uçlarında IP bazlı rate limit vardır.
- Production'da `COOKIE_SECURE=true` olmalı ve uygulama bir proxy arkasındaysa `app.ts` içindeki `trust proxy` satırı açılmalı.

## Rol tabanlı yetki

Korumalı bir route örneği:
```ts
import { requireAuth, requireRole } from "./middleware/auth.js";
router.post("/products", requireAuth, requireRole("ADMIN"), createProduct);
```
Bir kullanıcıyı admin yapmak için: `UPDATE users SET role = 'ADMIN' WHERE email = '...';`

## Klasör yapısı

```
src/
  config/env.ts          ortam değişkenleri (zod ile doğrulanır)
  db/                    bağlantı havuzu, migration çalıştırıcı ve SQL dosyaları
  lib/                   token, şifre, e-posta yardımcıları
  middleware/            auth, doğrulama, rate limit, hata yakalama
  modules/auth/          auth endpoint'leri (routes → controller → service)
  modules/users/         kullanıcı sorguları ve /users/me
```
