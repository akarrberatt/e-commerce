# E-Commerce Backend

Express + TypeScript + PostgreSQL. Hazır modüller: auth (kayıt, e-posta doğrulama, giriş, şifre sıfırlama, Google ile giriş, refresh token rotation, çıkış), profil, kategoriler, markalar, ürünler (listeleme, filtreleme, arama önerisi, detay), favoriler ve ürün değerlendirmeleri.

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
   Docker yoksa aşağıdaki [Docker olmadan kurulum](#docker-olmadan-kurulum) bölümüne bak.

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

5. **Örnek veriyi yükle** (kategoriler, markalar, ürünler, sahte yorumcular ve değerlendirmeler; tekrar çalıştırılabilir, production'da çalışmaz)
   ```bash
   npm run db:seed
   ```

6. **Çalıştır**
   ```bash
   npm run dev
   ```
   API: http://localhost:8000/api

### Docker olmadan kurulum

Docker yoksa yalnızca 2. adım değişir; diğer adımlar aynıdır.

1. **PostgreSQL 16'yı yerel kur**
   - macOS: `brew install postgresql@16 && brew services start postgresql@16`
   - Windows: [resmi installer](https://www.postgresql.org/download/windows/) (kurulumda `postgres` kullanıcısının şifresini `postgres` yap)
2. **Kullanıcı ve veritabanı**: `.env.example`'daki `DATABASE_URL` `postgres` / `postgres` kullanıcısını ve `ecommerce` veritabanını bekler.
   ```bash
   # macOS'ta Homebrew "postgres" rolünü oluşturmaz; önce onu oluştur (Windows'ta bu satırı atla):
   psql postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
   psql -U postgres -h localhost -c "CREATE DATABASE ecommerce;"
   ```
   Farklı bir kullanıcı/şifre kullanacaksan `.env` içindeki `DATABASE_URL`'i ona göre değiştir.
3. **E-posta**: Mailpit olmadığı için `.env`'de `SMTP_HOST` boş kalsın. Bu durumda e-posta gönderilmez; doğrulama ve şifre sıfırlama bağlantıları sunucu konsoluna (`npm run dev` çıktısı) yazılır, oradan kopyalayıp tarayıcıda açarsın.

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
| GET | `/api/categories` | | `200 { categories: [{ id, name, slug, children: [{ id, name, slug }] }] }` | |
| GET | `/api/products` | query (aşağıda), token opsiyonel | `200 { items: ProductSummary[], pagination }` | `400 VALIDATION_ERROR`, `401 INVALID_TOKEN`, `404 NOT_FOUND` (kategori yok) |
| GET | `/api/products/:slug` | token opsiyonel | `200 { product: ProductDetail }` | `401 INVALID_TOKEN`, `404 NOT_FOUND` (yok veya pasif) |
| GET | `/api/brands` | query `category` (opsiyonel) | `200 { brands: [{ name, slug, productCount }] }` | `400 VALIDATION_ERROR`, `404 NOT_FOUND` (kategori yok) |
| GET | `/api/search/suggest` | query `q` | `200 { products, categories, brands }` | `400 VALIDATION_ERROR` (100 karakterden uzun), `429 RATE_LIMITED` |
| GET | `/static/products/<dosya>` | (`/api` altında değil) | `200` görsel dosyası | `404` |
| GET | `/api/favorites` | `Authorization: Bearer <token>`, query `page`, `limit` | `200 { items: ProductSummary[], pagination }` | `400 VALIDATION_ERROR`, `401` |
| PUT | `/api/favorites/:productId` | `Authorization: Bearer <token>` | `200 { isFavorite: true, favoriteCount }` (idempotent) | `400 VALIDATION_ERROR` (UUID değil), `401`, `404 NOT_FOUND`, `429` |
| DELETE | `/api/favorites/:productId` | `Authorization: Bearer <token>` | `200 { isFavorite: false, favoriteCount }` (idempotent) | `400 VALIDATION_ERROR`, `401`, `404 NOT_FOUND`, `429` |
| GET | `/api/products/:slug/reviews` | query `page`, `limit`, `sort`; token opsiyonel | `200 { items: Review[], pagination, summary, myReview }` | `400 VALIDATION_ERROR`, `401 INVALID_TOKEN`, `404 NOT_FOUND` |
| POST | `/api/products/:slug/reviews` | `Authorization: Bearer <token>` + `{ rating, comment? }` | `201 { review }` | `400 VALIDATION_ERROR`, `401`, `404 NOT_FOUND`, `409 REVIEW_EXISTS`, `429` |
| PATCH | `/api/reviews/:id` | `Authorization: Bearer <token>` + `{ rating?, comment? }` (en az biri) | `200 { review }` | `400 VALIDATION_ERROR`, `401`, `404 NOT_FOUND` (yok veya başkasına ait) |
| DELETE | `/api/reviews/:id` | `Authorization: Bearer <token>` | `204` | `400 VALIDATION_ERROR`, `401`, `404 NOT_FOUND` (yok veya başkasına ait) |

Base URL: `http://localhost:8000/api`. `user` nesnesi: `{ id, name, email, role, emailVerified, createdAt }`.

Kurallar: şifre en az 8 karakter, ad soyad boş olamaz, e-posta büyük/küçük harf duyarsız (küçük harfe çevrilerek saklanır). Korumalı uçlar geçersiz/süresi dolmuş token'a `401` döner.

Tüm hatalar `{ message, code }` biçimindedir. Frontend `message`'ı kullanıcıya gösterebilir, `code` ile dallanabilir (ör. `EMAIL_NOT_VERIFIED` gelince "tekrar gönder" butonu).

E-posta bağlantıları frontend'e gider:
- Doğrulama: `FRONTEND_URL/verify-email?token=...` (24 saat) → frontend `POST /api/auth/verify-email`
- Şifre sıfırlama: `FRONTEND_URL/reset-password?token=...` (60 dk, tek kullanımlık) → frontend `POST /api/auth/reset-password`

`403` iki durumda döner: login'de e-posta doğrulanmamışsa (`EMAIL_NOT_VERIFIED`) ve rol gerektiren uçlarda yetkisiz kullanıcıya (`FORBIDDEN`). Frontend `code` alanına bakarak ayırt eder.

## Ürünler ve kategoriler

Bu uçlar herkese açıktır (auth gerekmez). Token gönderilirse kişiye özel alanlar (`isFavorite`, yorumlarda `myReview`/`isMine`) doldurulur; token yoksa `false`/`null` döner. `Authorization` başlığı gönderilip token geçersiz veya süresi dolmuşsa anonim sonuç yerine `401 INVALID_TOKEN` döner (frontend refresh dener). Admin CRUD yoktur; veri `npm run db:seed` ile yüklenir. Kategoriler iki seviyelidir (üst > alt), ürünlerde varyant yoktur (tek fiyat, tek stok).

`GET /api/products` query parametreleri (hepsi opsiyonel):

| Parametre | Açıklama |
|---|---|
| `page` | Varsayılan 1, en az 1. `total`'i aşan sayfa boş `items` ile `200` döner. |
| `limit` | Varsayılan 20, 1–50. |
| `category` | Kategori slug'ı. Üst kategoriyse alt kategorilerinin ürünleri de gelir. Bulunamazsa `404`. |
| `brand` | Virgülle ayrılmış marka slug'ları (`brand=novabit,tekvia`), en fazla 10. Bilinmeyen slug hata değildir, eşleşen ürün olmaz. |
| `q` | Ürün adı veya marka adında arama, en fazla 100 karakter. Büyük/küçük harf ve Türkçe karakter duyarsızdır (`KULAKLIK`, `kulaklik`, `Kulaklık` aynı sonucu verir). |
| `minPrice`, `maxPrice` | TL cinsinden sayı. `minPrice > maxPrice` ise `400`. |
| `inStock` | `true` ise yalnızca stokta olanlar. |
| `minRatingCount` | Tam sayı, 0–100000, varsayılan 0. Yalnızca en az bu kadar değerlendirmesi olan ürünler. |
| `sort` | `newest` (varsayılan), `price_asc`, `price_desc`, `rating` (Bayes ortalaması, aşağıda), `discount` (indirim oranı yüksekten düşüğe, indirimsizler sonda), `favorites` (favori sayısı yüksekten düşüğe). |

Yalnızca aktif ürünler döner. `pagination`: `{ page, limit, total, totalPages }`.

```ts
interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: { name: string; slug: string } | null;
  price: number;               // TL, ör. 1299.9
  oldPrice: number | null;     // indirim öncesi fiyat (TL)
  discountRate: number | null; // tam sayı yüzde; oldPrice yoksa null
  currency: "TRY";
  image: string | null;        // ilk görselin tam URL'i; görseli olmayan üründe null
  stock: number;
  inStock: boolean;
  rating: { average: number; count: number }; // gerçek yorumlardan hesaplanır; yorum yoksa 0 / 0
  favoriteCount: number;
  isFavorite: boolean;         // isteği yapan kullanıcının favorisinde mi; token yoksa false
  category: { id: string; name: string; slug: string };
}

interface ProductDetail extends ProductSummary {
  description: string;
  images: { url: string; alt: string }[];      // sıralı, tam URL; görsel yoksa []
  breadcrumb: { name: string; slug: string }[]; // üst kategori (varsa), sonra ürünün kategorisi
}
```

Para veritabanında kuruş cinsinden `INTEGER` tutulur (`price_kurus`); API'de TL'ye çevrilir (`src/lib/money.ts`).

### Puan sıralaması

`sort=rating` ham ortalamaya göre değil Bayes ortalamasına göre sıralar; böylece tek yorumla 5 puan almış bir ürün, yüzlerce yorumla 4.7 almış ürünün önüne geçmez:

```
skor = (v / (v + m)) * R + (m / (v + m)) * C
```

`v` = ürünün değerlendirme sayısı, `R` = ürünün ortalaması, `m` = 10, `C` = aktif ürünlerin değerlendirme sayısıyla ağırlıklı genel ortalaması (her istekte hesaplanır). Eşitlikte `id`. Skor yanıtta dönmez; `rating.average` gerçek ortalamadır.

### Görseller

`backend/public` klasörü `/static` altında sunulur (ör. `http://localhost:8000/static/products/<slug>.jpg`): `Cache-Control: public, max-age=604800`, `Cross-Origin-Resource-Policy: cross-origin` (frontend farklı origin'den yükleyebilsin diye; yalnızca `/static` için). Dizin listeleme yoktur.

`product_images.url` ya tam bir `http(s)://` URL'idir ya da `/static/...` ile başlayan bir yoldur; ikincisi yanıtta `PUBLIC_BASE_URL` (`.env`, varsayılan `http://localhost:8000`) ile tam URL'e çevrilir. Görseli olmayan üründe `image: null`, `images: []` döner; yer tutucu görsel üretilmez.

Seed, ürün tanımında `images` verilmişse onu kullanır; verilmemişse `public/products/` altında `<slug>.jpg`, `<slug>-2.jpg`, `<slug>-3.jpg` dosyalarını arar. Yeni görsel eklemek için dosyayı bu adla klasöre koyup `npm run db:seed` çalıştırmak yeterlidir.

### Markalar

`GET /api/brands` yalnızca aktif ürünü olan markaları ada göre sıralı döner; `productCount` aktif ürün sayısıdır. `category=<slug>` verilirse yalnızca o kategorideki ürünler sayılır (üst kategori alt kategorilerini kapsar); bilinmeyen kategori `404`.

### Arama önerisi

`GET /api/search/suggest?q=...` herkese açıktır. `q` trim edilir; 2 karakterden kısaysa üç dizi de boş döner (`200`), 100 karakterden uzunsa `400`. Arama, ürün listesindeki `q` ile aynı Türkçe karakter duyarsız eşleştirmeyi kullanır; adı `q` ile başlayanlar önce gelir. IP başına dakikada 120 istek sınırı vardır (`429 RATE_LIMITED`).

```ts
interface Suggestions {
  products: { id: string; slug: string; name: string; image: string | null; price: number }[]; // en fazla 6, aktif ürünler
  categories: { name: string; slug: string }[]; // en fazla 4
  brands: { name: string; slug: string }[];     // en fazla 4, aktif ürünü olanlar
}
```

## Favoriler

Tüm uçlar giriş gerektirir. `PUT` ve `DELETE` idempotenttir: ürün zaten favorideyse (veya zaten değilse) yine `200` döner ve sayaç değişmez. Ürün yoksa veya pasifse `404 "Ürün bulunamadı."`. `GET /api/favorites` en son eklenen önce sıralıdır, pasif ürünleri içermez; `page`/`limit` kuralları `/api/products` ile aynıdır. `PUT`/`DELETE` için kullanıcı başına dakikada 60 istek sınırı vardır.

`products.favorite_count` favori eklenip silindikçe aynı transaction içinde güncellenir.

## Değerlendirmeler (yorumlar)

Bir kullanıcı bir ürüne tek değerlendirme yazabilir; ikincisi `409 REVIEW_EXISTS` döner (mevcut olan `PATCH` ile düzenlenir). Satın alma doğrulaması henüz yoktur (sipariş modülü gelince eklenecek). `POST` için kullanıcı başına saatte 10 istek sınırı vardır.

- `rating`: 1–5 arası tam sayı. `comment`: opsiyonel, trim edilir, en fazla 2000 karakter (verilmezse `""`).
- `PATCH`/`DELETE`: değerlendirme yoksa veya başkasına aitse `404 "Değerlendirme bulunamadı."` (403 dönülmez).
- Her ekleme/güncelleme/silmede ürünün `rating.average` (bir ondalık, yorum yoksa 0) ve `rating.count` değerleri aynı transaction içinde yeniden hesaplanır.

`GET /api/products/:slug/reviews` query parametreleri: `page` (varsayılan 1), `limit` (varsayılan 10, 1–50), `sort`: `newest` (varsayılan), `rating_desc`, `rating_asc`.

```ts
interface Review {
  id: string;
  rating: number;      // 1–5
  comment: string;     // boş olabilir
  createdAt: string;
  updatedAt: string;
  isMine: boolean;     // isteği yapan kullanıcıya mı ait; token yoksa false
  user: { displayName: string }; // kısaltılmış ad: "Berat Akar" → "Berat A."; e-posta/id dönmez
}

interface ReviewListResponse {
  items: Review[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: {
    average: number; // ürünün rating.average değeriyle aynı
    count: number;
    distribution: { "1": number; "2": number; "3": number; "4": number; "5": number };
  };
  myReview: Review | null; // isteği yapanın bu ürüne değerlendirmesi; token yoksa null
}
```

`npm run db:seed` 80 sahte yorumcu (`yorumcu1@example.com` … `yorumcu80@example.com`; şifreleri yoktur, giriş yapamazlar) ve ürünlere örnek değerlendirmeler ekler. Gerçek kullanıcıların değerlendirme ve favorilerine dokunmaz.

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
  config/                ortam değişkenleri (env.ts, zod ile doğrulanır), klasör yolları (paths.ts)
  db/                    bağlantı havuzu, migration çalıştırıcı, SQL dosyaları ve seed.ts
  lib/                   token, şifre, e-posta, para (kuruş ↔ TL), görsel URL'i ve arama normalizasyonu yardımcıları
  middleware/            auth, doğrulama, rate limit, hata yakalama
  modules/auth/          auth endpoint'leri (routes → controller → service), google.ts
  modules/users/         kullanıcı sorguları, GET ve PATCH /users/me
  modules/categories/    kategori ağacı (routes → controller → service → repository)
  modules/products/      ürün listesi ve detayı (routes → controller → service → repository)
  modules/favorites/     favori ekleme/kaldırma ve favori listesi
  modules/reviews/       ürün değerlendirmeleri (ürüne bağlı uçlar products.routes.ts'te bağlanır)
  modules/brands/        marka listesi ve ürün sayıları
  modules/search/        arama önerisi (GET /search/suggest)
public/products/         ürün görselleri (<slug>.jpg); /static/products altında sunulur
```
