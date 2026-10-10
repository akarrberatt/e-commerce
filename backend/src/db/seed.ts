/**
 * Geliştirme verisi: kategoriler ve ürünler. İdempotent — slug üzerinden upsert yapar,
 * tekrar çalıştırınca kopya oluşturmaz. Kullanım: npm run db:seed
 */
import { isProd } from "../config/env.js";
import { tlToKurus } from "../lib/money.js";
import { pool, withTransaction } from "./pool.js";

interface SeedCategory {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
}

interface SeedProduct {
  category: string; // alt kategori slug'ı
  name: string;
  brand: string;
  price: number; // TL
  oldPrice?: number; // TL
  stock: number;
  images: number;
  description: string;
  active?: boolean;
}

const categories: SeedCategory[] = [
  {
    name: "Elektronik",
    slug: "elektronik",
    children: [
      { name: "Telefon", slug: "telefon" },
      { name: "Bilgisayar", slug: "bilgisayar" },
      { name: "Kulaklık", slug: "kulaklik" },
    ],
  },
  {
    name: "Giyim",
    slug: "giyim",
    children: [
      { name: "Kadın", slug: "kadin-giyim" },
      { name: "Erkek", slug: "erkek-giyim" },
    ],
  },
  {
    name: "Ev & Yaşam",
    slug: "ev-yasam",
    children: [
      { name: "Mutfak", slug: "mutfak" },
      { name: "Dekorasyon", slug: "dekorasyon" },
    ],
  },
  {
    name: "Spor",
    slug: "spor",
    children: [
      { name: "Fitness", slug: "fitness" },
      { name: "Outdoor", slug: "outdoor" },
    ],
  },
];

// Markalar uydurmadır. Listedeki sıra "en yeni" sıralamasını belirler (ilk ürün en yeni).
const products: SeedProduct[] = [
  // Elektronik > Telefon
  {
    category: "telefon", name: "Novabit X5 Akıllı Telefon 128 GB", brand: "Novabit",
    price: 18999.9, oldPrice: 21999, stock: 24, images: 3,
    description: "6,5 inç AMOLED ekran, 50 MP ana kamera ve 5000 mAh batarya. Gün boyu kullanım için hızlı şarj desteği sunar.",
  },
  {
    category: "telefon", name: "Novabit X5 Pro Akıllı Telefon 256 GB", brand: "Novabit",
    price: 27499, stock: 8, images: 3,
    description: "120 Hz yenileme hızına sahip ekranı ve optik sabitlemeli üçlü kamerasıyla serinin en güçlü modeli.",
  },
  {
    category: "telefon", name: "Tekvia Lite 4G Akıllı Telefon 64 GB", brand: "Tekvia",
    price: 6499.9, oldPrice: 7999.9, stock: 0, images: 2,
    description: "Günlük kullanım için uygun fiyatlı, çift SIM destekli ve uzun pil ömürlü giriş seviyesi telefon.",
  },
  {
    category: "telefon", name: "Tekvia Hızlı Şarj Adaptörü 33W", brand: "Tekvia",
    price: 349.9, stock: 150, images: 1,
    description: "USB-C çıkışlı, aşırı ısınma ve aşırı akım korumalı 33W hızlı şarj adaptörü.",
  },

  // Elektronik > Bilgisayar
  {
    category: "bilgisayar", name: "Pikselon Air 14 Dizüstü Bilgisayar 16 GB RAM 512 GB SSD", brand: "Pikselon",
    price: 32999, oldPrice: 36999, stock: 12, images: 3,
    description: "1,3 kg ağırlığında metal kasa, 14 inç IPS ekran ve 12 saate kadar pil ömrü. Ofis ve okul için ideal.",
  },
  {
    category: "bilgisayar", name: "Pikselon Oyun Bilgisayarı 15.6 inç 32 GB RAM", brand: "Pikselon",
    price: 54999, stock: 5, images: 3,
    description: "144 Hz ekran, harici ekran kartı ve gelişmiş soğutma sistemiyle yüksek ayarlarda akıcı oyun deneyimi.",
  },
  {
    category: "bilgisayar", name: "Tekvia Kablosuz Mouse", brand: "Tekvia",
    price: 289.9, oldPrice: 399.9, stock: 200, images: 1,
    description: "Sessiz tuşlu, 1600 DPI optik sensörlü ve tek pille 12 aya kadar kullanım sunan kablosuz mouse.",
  },
  {
    category: "bilgisayar", name: "Pikselon Mekanik Klavye Türkçe Q", brand: "Pikselon",
    price: 1299.9, oldPrice: 1599.9, stock: 37, images: 2,
    description: "Kırmızı switch'li, RGB aydınlatmalı ve sökülebilir kablolu Türkçe Q mekanik klavye.",
  },

  // Elektronik > Kulaklık
  {
    category: "kulaklik", name: "Sesval Bluetooth Kulak İçi Kulaklık", brand: "Sesval",
    price: 899.9, oldPrice: 1199.9, stock: 60, images: 2,
    description: "Şarj kutusuyla 28 saate varan kullanım, dokunmatik kontrol ve suya dayanıklı gövde.",
  },
  {
    category: "kulaklik", name: "Sesval Gürültü Önleyici Kulak Üstü Kulaklık", brand: "Sesval",
    price: 3499, stock: 18, images: 3,
    description: "Aktif gürültü önleme, yumuşak kulak yastıkları ve katlanabilir tasarım. Uzun yolculuklar için tasarlandı.",
  },
  {
    category: "kulaklik", name: "Sesval Kablolu Oyuncu Kulaklığı", brand: "Sesval",
    price: 649.9, stock: 0, images: 1,
    description: "Esnek mikrofonlu, 7.1 sanal surround destekli ve hafif gövdeli oyuncu kulaklığı.",
  },

  // Giyim > Kadın
  {
    category: "kadin-giyim", name: "Moda Lale Keten Gömlek Elbise", brand: "Moda Lale",
    price: 799.9, oldPrice: 1099.9, stock: 40, images: 2,
    description: "Keten karışımlı kumaştan, kuşaklı ve midi boy gömlek elbise. Yaz ayları için serin tutar.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Yüksek Bel Mom Jean", brand: "Moda Lale",
    price: 649.9, stock: 55, images: 2,
    description: "Yüksek bel, rahat kalıp ve bilekte biten paça. %100 pamuklu denim kumaş.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Oversize Triko Kazak", brand: "Moda Lale",
    price: 549.9, oldPrice: 749.9, stock: 30, images: 1,
    description: "Yumuşak dokulu, düşük omuzlu ve bisiklet yaka oversize triko kazak.",
  },
  {
    category: "kadin-giyim", name: "Moda Lale Trençkot", brand: "Moda Lale",
    price: 1899.9, stock: 9, images: 2,
    description: "Su itici kumaştan, kruvaze yakalı ve kemerli klasik kesim trençkot.",
  },

  // Giyim > Erkek
  {
    category: "erkek-giyim", name: "Kuzeyhan Slim Fit Oxford Gömlek", brand: "Kuzeyhan",
    price: 459.9, oldPrice: 599.9, stock: 80, images: 1,
    description: "Pamuklu oxford kumaş, düğmeli yaka ve dar kesim. Ofiste ve günlük kullanımda rahat.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Chino Pantolon", brand: "Kuzeyhan",
    price: 599.9, stock: 65, images: 2,
    description: "Esnek gabardin kumaştan, yan cepli ve normal bel chino pantolon.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Kapüşonlu Sweatshirt", brand: "Kuzeyhan",
    price: 499.9, oldPrice: 699.9, stock: 0, images: 1,
    description: "İçi şardonlu, kanguru cepli ve kapüşonlu basic sweatshirt.",
  },
  {
    category: "erkek-giyim", name: "Kuzeyhan Şişme Mont", brand: "Kuzeyhan",
    price: 2199.9, oldPrice: 2999.9, stock: 14, images: 3,
    description: "Rüzgar geçirmez dış yüzey, elyaf dolgu ve çıkarılabilir kapüşon. Soğuk havalar için hafif mont.",
  },

  // Ev & Yaşam > Mutfak
  {
    category: "mutfak", name: "Mutfakça 7 Parça Granit Tencere Seti", brand: "Mutfakça",
    price: 2499.9, oldPrice: 3299.9, stock: 22, images: 3,
    description: "Yapışmaz granit kaplama, ısıya dayanıklı kulplar ve cam kapaklar. Tüm ocak tiplerine uygundur.",
  },
  {
    category: "mutfak", name: "Mutfakça Cam Demlikli Çay Makinesi", brand: "Mutfakça",
    price: 1399.9, stock: 31, images: 2,
    description: "1,7 litre su ısıtıcı, 1 litre cam demlik ve sıcak tutma özelliği.",
  },
  {
    category: "mutfak", name: "Mutfakça Bambu Kesme Tahtası 3'lü Set", brand: "Mutfakça",
    price: 329.9, stock: 120, images: 1,
    description: "Üç farklı boyda, doğal bambudan üretilmiş ve askı delikli kesme tahtası seti.",
  },
  {
    category: "mutfak", name: "Mutfakça 12 Kişilik Porselen Yemek Takımı", brand: "Mutfakça",
    price: 3999, oldPrice: 4999, stock: 6, images: 2,
    description: "56 parça, bulaşık makinesinde yıkanabilir ve altın yaldız detaylı porselen yemek takımı.",
  },

  // Ev & Yaşam > Dekorasyon
  {
    category: "dekorasyon", name: "Dekoriva El Dokuması Kilim 120x180", brand: "Dekoriva",
    price: 1749.9, oldPrice: 2199.9, stock: 11, images: 2,
    description: "Pamuk iplikten el dokuması, çift taraflı kullanılabilen geometrik desenli kilim.",
  },
  {
    category: "dekorasyon", name: "Dekoriva Ahşap Ayaklı Lambader", brand: "Dekoriva",
    price: 1099.9, stock: 19, images: 2,
    description: "Üç ayaklı doğal ahşap gövde ve keten başlık. Salon ve okuma köşeleri için yumuşak ışık sağlar.",
  },
  {
    category: "dekorasyon", name: "Dekoriva 3'lü Seramik Vazo Seti", brand: "Dekoriva",
    price: 449.9, oldPrice: 599.9, stock: 48, images: 1,
    description: "Mat yüzeyli, farklı boylarda üç parçadan oluşan el yapımı seramik vazo seti.",
  },

  // Spor > Fitness
  {
    category: "fitness", name: "Formda 8 mm Kaymaz Yoga Matı", brand: "Formda",
    price: 399.9, oldPrice: 549.9, stock: 90, images: 2,
    description: "8 mm kalınlık, kaymaz yüzey ve taşıma askısı. Yoga, pilates ve esneme hareketleri için.",
  },
  {
    category: "fitness", name: "Formda Ayarlanabilir Dambıl Seti 20 kg", brand: "Formda",
    price: 1899.9, stock: 16, images: 2,
    description: "Sökülüp takılabilen plakalarla 2,5 kg'dan 20 kg'a kadar ayarlanabilen dambıl seti.",
  },
  {
    category: "fitness", name: "Formda Direnç Bandı 5'li Set", brand: "Formda",
    price: 249.9, oldPrice: 349.9, stock: 140, images: 1,
    description: "Beş farklı direnç seviyesinde lateks bant ve taşıma çantası.",
  },
  {
    category: "fitness", name: "Formda Atlama İpi", brand: "Formda",
    price: 99.9, stock: 300, images: 1,
    description: "Boyu ayarlanabilir çelik tel ve rulmanlı tutma saplarına sahip hız ipi.",
  },

  // Spor > Outdoor
  {
    category: "outdoor", name: "Zirve Yolu 2 Kişilik Kamp Çadırı", brand: "Zirve Yolu",
    price: 2799.9, oldPrice: 3499.9, stock: 13, images: 3,
    description: "Çift katmanlı, 3000 mm su geçirmezlik değerine sahip ve 5 dakikada kurulabilen kamp çadırı.",
  },
  {
    category: "outdoor", name: "Zirve Yolu 45 Litre Trekking Sırt Çantası", brand: "Zirve Yolu",
    price: 1599.9, stock: 27, images: 2,
    description: "Havalandırmalı sırt sistemi, yağmurluk kılıfı ve bel destekli 45 litre trekking çantası.",
  },
  {
    category: "outdoor", name: "Zirve Yolu Eksi 5 Derece Uyku Tulumu", brand: "Zirve Yolu",
    price: 1249.9, oldPrice: 1499.9, stock: 0, images: 1,
    description: "-5°C konfor sıcaklığına sahip, mumya tipi ve sıkıştırma torbalı uyku tulumu.",
  },
  {
    category: "outdoor", name: "Zirve Yolu Paslanmaz Çelik Termos 1 L", brand: "Zirve Yolu",
    price: 579.9, stock: 75, images: 1,
    description: "Çift cidarlı vakum yalıtım: içecekleri 24 saat sıcak, 36 saat soğuk tutar.",
  },

  // Pasif ürün: listede ve detayda görünmemeli.
  {
    category: "telefon", name: "Tekvia Eski Model Tablet 7 inç", brand: "Tekvia",
    price: 2999, stock: 0, images: 1, active: false,
    description: "Üretimi sona eren 7 inç ekranlı tablet.",
  },
];

// Sahte yorumcular: yorumcu1@example.com ... yorumcu8@example.com (isimler uydurmadır).
const reviewers = [
  "Ayşe Yılmaz",
  "Mehmet Demir",
  "Zeynep Kaya",
  "Mustafa Çelik",
  "Elif Şahin",
  "Emre Öztürk",
  "Fatma Aydın",
  "Burak Arslan",
];

// Ürün sırasına göre döner; her dizi o ürünün yorum puanlarıdır (0–8 yorum).
// Boş diziler yorumsuz ürünlerdir; bazı ürünler yüksek, bazıları karışık puanlıdır.
const ratingPatterns: number[][] = [
  [5, 5, 4, 5, 5, 4, 5, 5],
  [4, 5, 3, 4, 5],
  [5, 2, 4, 1, 3, 5, 2],
  [],
  [5, 4, 5],
  [3, 4, 2, 5, 1, 3],
  [5, 5, 5, 4, 5, 4],
  [4],
  [2, 3, 1, 4, 2],
  [],
  [5, 4, 4, 5, 3, 4, 5],
];

const reviewComments: Record<number, string[]> = {
  1: [
    "Hiç memnun kalmadım, iade ettim.",
    "İki hafta dolmadan bozuldu. Tavsiye etmiyorum.",
    "Görseldeki ürünle alakası yok, kalitesi çok kötü.",
  ],
  2: [
    "Beklediğim gibi çıkmadı, fiyatına göre kalitesi zayıf.",
    "Kargo çok geç geldi, paketleme de özensizdi.",
    "İdare eder ama bir daha almam.",
  ],
  3: [
    "Fena değil, fiyatına göre idare eder.",
    "Ortalama bir ürün, ne iyi ne kötü.",
    "İşimi görüyor ama malzeme kalitesi daha iyi olabilirdi.",
    "Kargo hızlıydı, ürün vasat.",
  ],
  4: [
    "Gayet iyi, memnunum. Kargo biraz gecikti sadece.",
    "Kaliteli bir ürün, fiyatı biraz daha uygun olabilirdi.",
    "Beklentimi karşıladı, tavsiye ederim.",
    "Güzel ürün, paketleme özenliydi.",
  ],
  5: [
    "Harika bir ürün, kesinlikle tavsiye ederim.",
    "Fiyat performans açısından çok başarılı.",
    "Tam beklediğim gibi geldi, çok memnun kaldım.",
    "Hızlı kargo, sağlam paketleme. Teşekkürler.",
    "İkinci kez alıyorum, kalitesinden şaşmıyor.",
  ],
};

const TR_CHARS: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

function slugify(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (ch) => TR_CHARS[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  if (isProd) {
    throw new Error("Seed production ortamında çalıştırılamaz (NODE_ENV=production).");
  }

  await withTransaction(async (db) => {
    const upsertCategory = async (name: string, slug: string, parentId: string | null, sortOrder: number) => {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO categories (name, slug, parent_id, sort_order) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [name, slug, parentId, sortOrder],
      );
      return rows[0]!.id;
    };

    const categoryIds = new Map<string, string>();
    for (const [i, parent] of categories.entries()) {
      const parentId = await upsertCategory(parent.name, parent.slug, null, i);
      for (const [j, child] of parent.children.entries()) {
        categoryIds.set(child.slug, await upsertCategory(child.name, child.slug, parentId, j));
      }
    }

    const activeProductIds: string[] = [];
    for (const [i, product] of products.entries()) {
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) throw new Error(`Bilinmeyen kategori: ${product.category}`);
      const slug = slugify(product.name);

      // created_at yalnızca ilk eklemede yazılır: sıra birer saat arayla geriye gider.
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO products
           (category_id, slug, name, description, brand, price_kurus, compare_at_price_kurus,
            stock, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - make_interval(hours => $10))
         ON CONFLICT (slug) DO UPDATE
           SET category_id = EXCLUDED.category_id, name = EXCLUDED.name, description = EXCLUDED.description,
               brand = EXCLUDED.brand, price_kurus = EXCLUDED.price_kurus,
               compare_at_price_kurus = EXCLUDED.compare_at_price_kurus, stock = EXCLUDED.stock,
               is_active = EXCLUDED.is_active, updated_at = now()
         RETURNING id`,
        [
          categoryId,
          slug,
          product.name,
          product.description,
          product.brand,
          tlToKurus(product.price),
          product.oldPrice === undefined ? null : tlToKurus(product.oldPrice),
          product.stock,
          product.active ?? true,
          i,
        ],
      );
      const productId = rows[0]!.id;

      await db.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
      for (let n = 1; n <= product.images; n++) {
        await db.query("INSERT INTO product_images (product_id, url, alt, sort_order) VALUES ($1, $2, $3, $4)", [
          productId,
          `https://picsum.photos/seed/${slug}-${n}/800/800`,
          `${product.name} - görsel ${n}`,
          n - 1,
        ]);
      }

      if (product.active ?? true) activeProductIds.push(productId);
    }

    // Sahte yorumcular: şifreleri yok ve doğrulanmamışlar, giriş yapamazlar.
    const reviewerIds: string[] = [];
    for (const [i, name] of reviewers.entries()) {
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO users (email, name, password_hash, email_verified) VALUES ($1, $2, NULL, FALSE)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [`yorumcu${i + 1}@example.com`, name],
      );
      reviewerIds.push(rows[0]!.id);
    }

    // Her şey ürün sırasından türetilir (rastgelelik yok): tekrar çalıştırınca aynı yorumlar çıkar ve
    // (product_id, user_id) çakışmasında atlanır. Gerçek kullanıcıların yorumlarına dokunulmaz.
    for (const [i, productId] of activeProductIds.entries()) {
      const ratings = ratingPatterns[i % ratingPatterns.length]!;
      for (const [k, rating] of ratings.entries()) {
        const comments = reviewComments[rating]!;
        // created_at son 6 aya (180 gün) dağılır.
        await db.query(
          `INSERT INTO reviews (product_id, user_id, rating, comment, created_at, updated_at)
           SELECT $1, $2, $3, $4, t, t
             FROM (SELECT now() - make_interval(days => $5, hours => $6) AS t) ts
           ON CONFLICT (product_id, user_id) DO NOTHING`,
          [
            productId,
            reviewerIds[(i + k) % reviewerIds.length],
            rating,
            comments[(i + k * 2) % comments.length],
            (i * 37 + k * 53 + 3) % 180,
            (i * 5 + k * 7) % 24,
          ],
        );
      }
    }

    // Puanlar gerçek yorumlardan hesaplanır (uygulamadaki recalculateProductRating ile aynı formül).
    await db.query(
      `UPDATE products p
          SET rating_avg = (SELECT COALESCE(round(avg(rating), 1), 0) FROM reviews WHERE product_id = p.id),
              rating_count = (SELECT count(*)::int FROM reviews WHERE product_id = p.id)`,
    );
  });

  const { rows } = await pool.query<{
    categories: number;
    products: number;
    images: number;
    reviewers: number;
    reviews: number;
  }>(
    `SELECT (SELECT count(*)::int FROM categories) AS categories,
            (SELECT count(*)::int FROM products) AS products,
            (SELECT count(*)::int FROM product_images) AS images,
            (SELECT count(*)::int FROM users WHERE email LIKE 'yorumcu%@example.com') AS reviewers,
            (SELECT count(*)::int FROM reviews) AS reviews`,
  );
  const c = rows[0]!;
  console.log(
    `Seed tamamlandı: ${c.categories} kategori, ${c.products} ürün, ${c.images} görsel, ` +
      `${c.reviewers} yorumcu, ${c.reviews} yorum.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed hatası:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
