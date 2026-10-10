# E-Commerce Backend

Express + TypeScript + PostgreSQL. Şu an auth modülü hazır: kayıt, e-posta doğrulama, giriş, şifre sıfırlama, Google ile giriş, refresh token rotation ve çıkış.

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
| POST | `/api/auth/register` | `{ name, email, password, acceptedTerms: true }` | `201 { message }` (token/çerez yok) | `400` doğrulama, `409 EMAIL_TAKEN` |
| POST | `/api/auth/verify-email` | `{ token }` | `200 { message }` (iki kez tıklanırsa da 200) | `400 INVALID_VERIFICATION_TOKEN` |
| POST | `/api/auth/resend-verification` | `{ email }` | `200 { message }` (her durumda aynı) | `429` |
| POST | `/api/auth/forgot-password` | `{ email }` | `200 { message }` (her durumda aynı) | `429` |
| POST | `/api/auth/reset-password` | `{ token, password }` | `200 { message }`, tüm oturumlar kapatılır | `400 INVALID_RESET_TOKEN`, `429` |
| POST | `/api/auth/change-password` | `Authorization: Bearer <token>` + `{ currentPassword, newPassword }` (+ cookie) | `200 { message }`, diğer cihazlardaki oturumlar kapatılır | `400 INVALID_CURRENT_PASSWORD`, `400 SAME_PASSWORD`, `400 PASSWORD_NOT_SET`, `401`, `429` |
| POST | `/api/auth/login` | `{ email, password }` | `200 { token, user }` + `Set-Cookie: refresh_token` | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `429` |
| POST | `/api/auth/refresh` | (cookie) | `200 { token, user }` + yeni cookie | `401 INVALID_REFRESH_TOKEN` |
| POST | `/api/auth/logout` | (cookie) | `204` | |
| GET | `/api/auth/google` | | `302` Google'a | |
| GET | `/api/auth/google/callback` | (Google'dan) | `302 FRONTEND_URL/auth/callback` + refresh çerezi | `302 FRONTEND_URL/auth/callback?error=google` |
| GET | `/api/users/me` | `Authorization: Bearer <token>` | `200 { user }` | `401` |
| PATCH | `/api/users/me` | `Authorization: Bearer <token>` + `{ name }` | `200 { user }` | `400` doğrulama, `401` |

Base URL: `http://localhost:8000/api`. `user` nesnesi: `{ id, name, email, role, emailVerified, createdAt }`.

Kurallar: şifre en az 8 karakter, ad soyad boş olamaz, e-posta büyük/küçük harf duyarsız (küçük harfe çevrilerek saklanır). Korumalı uçlar geçersiz/süresi dolmuş token'a `401` döner.

Tüm hatalar `{ message, code }` biçimindedir. Frontend `message`'ı kullanıcıya gösterebilir, `code` ile dallanabilir (ör. `EMAIL_NOT_VERIFIED` gelince "tekrar gönder" butonu).

E-posta bağlantıları frontend'e gider:
- Doğrulama: `FRONTEND_URL/verify-email?token=...` (24 saat) → frontend `POST /api/auth/verify-email`
- Şifre sıfırlama: `FRONTEND_URL/reset-password?token=...` (60 dk, tek kullanımlık) → frontend `POST /api/auth/reset-password`

`403` iki durumda döner: login'de e-posta doğrulanmamışsa (`EMAIL_NOT_VERIFIED`) ve rol gerektiren uçlarda yetkisiz kullanıcıya (`FORBIDDEN`). Frontend `code` alanına bakarak ayırt eder.

## Google ile giriş

1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application).
2. "Authorized redirect URIs" alanına `http://localhost:8000/api/auth/google/callback` ekle.
3. Client ID ve secret'ı `.env` içindeki `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` alanlarına yaz.

Ayarlanmamışsa `/api/auth/google` doğrudan `FRONTEND_URL/auth/callback?error=google` adresine yönlendirir.

Hesap eşleştirme kuralları:
- Aynı e-postayla şifreli bir hesap varsa Google hesabı ona bağlanır; kullanıcı iki yolla da girebilir.
- O hesap henüz doğrulanmamışsa şifresi ve adı silinir/Google'dakiyle değiştirilir (başkası o e-postayla kayıt olmuş olabilir). Gerçek sahibi isterse "şifremi unuttum" ile şifre belirler.
- Google ile açılan hesabın şifresi yoktur; şifreyle giriş `401` döner. "Şifremi unuttum" ile şifre belirlenebilir.

## Güvenlik kararları

- Şifreler bcrypt ile hash'lenir. Refresh ve doğrulama token'ları veritabanında SHA-256 hash'i olarak saklanır.
- Access token: JWT, 15 dk. Refresh token: opaque, 7 gün, `HttpOnly` + `SameSite=Lax` cookie, `Path=/api/auth`.
- **Refresh rotation:** her refresh'te eski token iptal edilir. Eski token `REFRESH_GRACE_SECONDS` (30 sn) içinde tekrar gelirse (iki sekme aynı anda yeniledi) kullanıcı çıkarılmaz, yeni token verilir. Bu süreden sonra gelirse çalınma şüphesiyle kullanıcının tüm oturumları kapatılır.
- Şifre sıfırlanınca kullanıcının tüm oturumları kapatılır.
- Oturumlar toplu kapatıldığında (şifre sıfırlama/değiştirme, reuse) tolerans süresi içindeki rotate edilmiş token'lar da geçersiz olur.
- Şifre değiştirilince (`change-password`) isteği yapan cihaz hariç tüm oturumlar kapatılır; istekte refresh çerezi yoksa hepsi kapatılır. Yanlış mevcut şifre `401` değil `400` döner (frontend 401'de oturumu kapatır).
- Şifresi olmayan (Google ile açılmış) hesap `change-password` ile şifre belirleyemez (`400 PASSWORD_NOT_SET`); çalınmış bir access token kalıcı erişime dönüşmesin diye şifre yalnızca "şifremi unuttum" e-postasıyla belirlenir.
- Kayıtta `acceptedTerms: true` zorunludur; onay zamanı ve metin sürümü (`TERMS_VERSION`) `users` tablosunda saklanır.
- Login'de önce şifre kontrol edilir; şifre yanlışsa hesabın var olup olmadığı ya da doğrulanıp doğrulanmadığı belli olmaz.
- Login, register, resend-verification, forgot-password, reset-password ve change-password uçlarında IP bazlı rate limit vardır. `/auth/refresh`'te yoktur (çerez yoksa veritabanına gitmeden 401 döner).
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
  modules/auth/          auth endpoint'leri (routes → controller → service), google.ts
  modules/users/         kullanıcı sorguları, GET ve PATCH /users/me
```
