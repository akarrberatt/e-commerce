# E-Commerce Backend — kalıcı kurallar

Express 5 + TypeScript + PostgreSQL (ham SQL ile `pg`), doğrulama `zod` ile. Modül deseni: routes → controller → service.

## Adresler

- API base: `http://localhost:8000/api`
- Frontend: `http://localhost:5173`

## Hatalar ve durum kodları

- Hata formatı her zaman `{ message, code }`. `message` Türkçe ve doğrudan kullanıcıya gösterilebilir olmalı. Hatalar `HttpError(status, message, code)` ile fırlatılır.
- `403` iki durumda döner: (a) login'de e-posta doğrulanmamışsa code `EMAIL_NOT_VERIFIED`, (b) admin gibi rol gerektiren uçlarda yetkisiz kullanıcıya code `FORBIDDEN` (`requireRole`). Müşteri arayüzünün çağırdığı hiçbir uç başka bir sebeple 403 dönmemeli. Frontend 403'te `code` alanına bakarak ayırt eder.
- `401` YALNIZCA kimlik doğrulama sorunlarında döner (token yok/geçersiz, oturum geçersiz, login'de hatalı bilgi). Frontend korumalı isteklerde 401 alınca refresh deniyor, o da 401 olursa oturumu kapatıyor. Bu yüzden "mevcut şifre yanlış" gibi iş kuralı hataları `400` olmalı.

## Opsiyonel kimlik doğrulama

- Herkese açık olup token gelirse kişiye özel alan (`isFavorite`, `myReview`) dolduran uçlar `optionalAuth` kullanır (ürün listesi, ürün detayı, yorum listesi).
- `Authorization` başlığı yoksa istek anonim devam eder (`req.auth` undefined). Başlık var ama token geçersiz/süresi dolmuşsa `401 INVALID_TOKEN` döner (`requireAuth` ile aynı); eski token'la sessizce anonim sonuç dönülmez, böylece frontend'in refresh akışı çalışır.
- Başkasına ait kayıt (ör. yorum) üzerinde işlem `403` değil `404` döner.

## Kullanıcı verisi

- Kullanıcı nesnesi `toPublicUser()` ile döner; `password_hash` asla dışarı çıkmaz.
- E-postalar trim + lowercase saklanır.
- Başka kullanıcılara gösterilen içerikte (yorumlar) kullanıcının e-postası veya id'si dönmez; yalnızca kısaltılmış ad (`toDisplayName`: "Berat Akar" → "Berat A.").
- Şifre kuralı: en az 8 karakter, en fazla 72 byte (bcrypt).

## Veritabanı

- Veritabanı değişiklikleri yeni bir numaralı SQL migration dosyasıyla yapılır (`src/db/migrations/NNN_ad.sql`); mevcut migration'lar asla düzenlenmez.
- `products.favorite_count`, `rating_avg` ve `rating_count` türetilmiş alanlardır; favori/yorum değişikliğiyle aynı transaction içinde güncellenir.

## Token'lar

- Refresh token çerezi `HttpOnly`, `SameSite=Lax`, `Path=/api/auth`.
- Token'lar DB'de SHA-256 hash olarak saklanır.

## Süreç

- Yeni özellikte `README.md`'deki endpoint tablosu güncellenir.
- Commit mesajları İngilizce, kısa başlık + madde listesi.
