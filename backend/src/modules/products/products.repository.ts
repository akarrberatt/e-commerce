import { pool, type DbClient } from "../../db/pool.js";
import { likePatterns, sqlNormalize } from "../../lib/search.js";
import type { ProductSort } from "./products.schemas.js";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand_name: string | null;
  brand_slug: string | null;
  price_kurus: number;
  compare_at_price_kurus: number | null;
  stock: number;
  rating_avg: string; // NUMERIC, pg string olarak döndürür
  rating_count: number;
  favorite_count: number;
  is_favorite: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
  image: string | null;
}

export interface ProductDetailRow extends ProductRow {
  description: string;
  parent_category_name: string | null;
  parent_category_slug: string | null;
}

export interface ProductImageRow {
  url: string;
  alt: string;
}

export interface ProductFilters {
  categoryIds?: string[];
  brandSlugs?: string[];
  q?: string;
  minPriceKurus?: number;
  maxPriceKurus?: number;
  inStock?: boolean;
  minRatingCount?: number;
}

// viewerParam: isteği yapan kullanıcının id'sini taşıyan parametre (ör. "$3"). Anonimse değeri NULL
// gönderilir ve is_favorite her satırda false çıkar. Tek sorguda EXISTS ile çözülür (N+1 yok).
export const summaryColumns = (viewerParam: string) => `
  p.id, p.slug, p.name, b.name AS brand_name, b.slug AS brand_slug,
  p.price_kurus, p.compare_at_price_kurus, p.stock,
  p.rating_avg, p.rating_count, p.favorite_count,
  EXISTS (
    SELECT 1 FROM favorites f WHERE f.product_id = p.id AND f.user_id = ${viewerParam}::uuid
  ) AS is_favorite,
  c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
  img.url AS image`;

export const FIRST_IMAGE_JOIN = `
  LEFT JOIN LATERAL (
    SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1
  ) img ON TRUE`;

const BRAND_JOIN = "LEFT JOIN brands b ON b.id = p.brand_id";

// Kategori, marka ve ilk görsel tek sorguda gelir (N+1 yok).
export const SUMMARY_JOINS = `
  JOIN categories c ON c.id = p.category_id
  ${BRAND_JOIN} ${FIRST_IMAGE_JOIN}`;

// sort=rating için Bayes ortalaması: az yorumlu ürünlerin puanı genel ortalamaya çekilir.
//   skor = (v / (v + m)) * R + (m / (v + m)) * C  =  (v * R + m * C) / (v + m)
// v = rating_count, R = rating_avg, m = BAYES_MIN_VOTES,
// C = aktif ürünlerin rating_count ile ağırlıklı ortalaması (her istekte CTE ile hesaplanır).
const BAYES_MIN_VOTES = 10;
const RATING_STATS_CTE = `
  WITH rating_stats AS (
    SELECT COALESCE(sum(rating_avg * rating_count) / NULLIF(sum(rating_count), 0), 0) AS mean
      FROM products
     WHERE is_active
  )`;

// Eşitlikte id ile ikincil sıralama: sayfalama kararlı olsun.
const ORDER_BY: Record<ProductSort, string> = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price_kurus ASC, p.id ASC",
  price_desc: "p.price_kurus DESC, p.id ASC",
  rating: `(p.rating_count * p.rating_avg + ${BAYES_MIN_VOTES} * (SELECT mean FROM rating_stats))
             / (p.rating_count + ${BAYES_MIN_VOTES}) DESC,
           p.id ASC`,
  // İndirim oranı yüksekten düşüğe; indirimsizler (NULL) sonda.
  discount: `(p.compare_at_price_kurus - p.price_kurus)::numeric / NULLIF(p.compare_at_price_kurus, 0) DESC NULLS LAST,
             p.id ASC`,
  favorites: "p.favorite_count DESC, p.id ASC",
};

function buildWhere(filters: ProductFilters) {
  const conditions = ["p.is_active"];
  const params: unknown[] = [];
  const add = (value: unknown) => `$${params.push(value)}`;

  if (filters.categoryIds) conditions.push(`p.category_id = ANY(${add(filters.categoryIds)}::uuid[])`);
  // Bilinmeyen marka slug'ı hata değildir; eşleşen ürün olmaz.
  if (filters.brandSlugs) conditions.push(`b.slug = ANY(${add(filters.brandSlugs)}::text[])`);
  if (filters.q) {
    // Türkçe karakter duyarsız: sütun ve aranan metin aynı normalizasyondan geçer.
    const pattern = add(likePatterns(filters.q).contains);
    conditions.push(
      `(${sqlNormalize("p.name")} LIKE ${pattern} ESCAPE '\\' OR ${sqlNormalize("b.name")} LIKE ${pattern} ESCAPE '\\')`,
    );
  }
  if (filters.minPriceKurus !== undefined) conditions.push(`p.price_kurus >= ${add(filters.minPriceKurus)}`);
  if (filters.maxPriceKurus !== undefined) conditions.push(`p.price_kurus <= ${add(filters.maxPriceKurus)}`);
  if (filters.inStock) conditions.push("p.stock > 0");
  if (filters.minRatingCount) conditions.push(`p.rating_count >= ${add(filters.minRatingCount)}`);

  return { where: conditions.join(" AND "), params };
}

export async function findProducts(
  filters: ProductFilters,
  sort: ProductSort,
  limit: number,
  offset: number,
  viewerId: string | null,
  db: DbClient = pool,
) {
  const { where, params } = buildWhere(filters);
  const { rows } = await db.query<ProductRow>(
    `${sort === "rating" ? RATING_STATS_CTE : ""}
     SELECT ${summaryColumns(`$${params.length + 3}`)}
       FROM products p ${SUMMARY_JOINS}
      WHERE ${where}
      ORDER BY ${ORDER_BY[sort]}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset, viewerId],
  );
  return rows;
}

export async function countProducts(filters: ProductFilters, db: DbClient = pool) {
  const { where, params } = buildWhere(filters);
  const { rows } = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM products p ${BRAND_JOIN} WHERE ${where}`,
    params,
  );
  return rows[0]?.total ?? 0;
}

export async function findActiveProductBySlug(slug: string, viewerId: string | null, db: DbClient = pool) {
  const { rows } = await db.query<ProductDetailRow>(
    `SELECT ${summaryColumns("$2")}, p.description,
            pc.name AS parent_category_name, pc.slug AS parent_category_slug
       FROM products p ${SUMMARY_JOINS}
       LEFT JOIN categories pc ON pc.id = c.parent_id
      WHERE p.slug = $1 AND p.is_active`,
    [slug, viewerId],
  );
  return rows[0] ?? null;
}

export async function findActiveProductIdBySlug(slug: string, db: DbClient = pool) {
  const { rows } = await db.query<{ id: string }>("SELECT id FROM products WHERE slug = $1 AND is_active", [slug]);
  return rows[0]?.id ?? null;
}

export async function findProductImages(productId: string, db: DbClient = pool) {
  const { rows } = await db.query<ProductImageRow>(
    "SELECT url, alt FROM product_images WHERE product_id = $1 ORDER BY sort_order, id",
    [productId],
  );
  return rows;
}
