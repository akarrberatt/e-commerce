import { pool, type DbClient } from "../../db/pool.js";
import type { ProductSort } from "./products.schemas.js";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  price_kurus: number;
  compare_at_price_kurus: number | null;
  stock: number;
  rating_avg: string; // NUMERIC, pg string olarak döndürür
  rating_count: number;
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
  q?: string;
  minPriceKurus?: number;
  maxPriceKurus?: number;
  inStock?: boolean;
}

const SUMMARY_COLUMNS = `
  p.id, p.slug, p.name, p.brand, p.price_kurus, p.compare_at_price_kurus, p.stock,
  p.rating_avg, p.rating_count,
  c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
  img.url AS image`;

// Kategori ve ilk görsel tek sorguda gelir (N+1 yok).
const SUMMARY_JOINS = `
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN LATERAL (
    SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order, id LIMIT 1
  ) img ON TRUE`;

// Eşitlikte id ile ikincil sıralama: sayfalama kararlı olsun.
const ORDER_BY: Record<ProductSort, string> = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price_kurus ASC, p.id ASC",
  price_desc: "p.price_kurus DESC, p.id ASC",
  rating: "p.rating_avg DESC, p.rating_count DESC, p.id ASC",
  // İndirim oranı yüksekten düşüğe; indirimsizler (NULL) sonda.
  discount: `(p.compare_at_price_kurus - p.price_kurus)::numeric / NULLIF(p.compare_at_price_kurus, 0) DESC NULLS LAST,
             p.id ASC`,
};

/** ILIKE kalıbındaki özel karakterleri (\ % _) düz metin olarak aratmak için kaçışlar. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

function buildWhere(filters: ProductFilters) {
  const conditions = ["p.is_active"];
  const params: unknown[] = [];
  const add = (value: unknown) => `$${params.push(value)}`;

  if (filters.categoryIds) conditions.push(`p.category_id = ANY(${add(filters.categoryIds)}::uuid[])`);
  if (filters.q) {
    const pattern = add(`%${escapeLike(filters.q)}%`);
    conditions.push(`(p.name ILIKE ${pattern} ESCAPE '\\' OR p.brand ILIKE ${pattern} ESCAPE '\\')`);
  }
  if (filters.minPriceKurus !== undefined) conditions.push(`p.price_kurus >= ${add(filters.minPriceKurus)}`);
  if (filters.maxPriceKurus !== undefined) conditions.push(`p.price_kurus <= ${add(filters.maxPriceKurus)}`);
  if (filters.inStock) conditions.push("p.stock > 0");

  return { where: conditions.join(" AND "), params };
}

export async function findProducts(
  filters: ProductFilters,
  sort: ProductSort,
  limit: number,
  offset: number,
  db: DbClient = pool,
) {
  const { where, params } = buildWhere(filters);
  const { rows } = await db.query<ProductRow>(
    `SELECT ${SUMMARY_COLUMNS}
       FROM products p ${SUMMARY_JOINS}
      WHERE ${where}
      ORDER BY ${ORDER_BY[sort]}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  return rows;
}

export async function countProducts(filters: ProductFilters, db: DbClient = pool) {
  const { where, params } = buildWhere(filters);
  const { rows } = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM products p WHERE ${where}`,
    params,
  );
  return rows[0]?.total ?? 0;
}

export async function findActiveProductBySlug(slug: string, db: DbClient = pool) {
  const { rows } = await db.query<ProductDetailRow>(
    `SELECT ${SUMMARY_COLUMNS}, p.description,
            pc.name AS parent_category_name, pc.slug AS parent_category_slug
       FROM products p ${SUMMARY_JOINS}
       LEFT JOIN categories pc ON pc.id = c.parent_id
      WHERE p.slug = $1 AND p.is_active`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function findProductImages(productId: string, db: DbClient = pool) {
  const { rows } = await db.query<ProductImageRow>(
    "SELECT url, alt FROM product_images WHERE product_id = $1 ORDER BY sort_order, id",
    [productId],
  );
  return rows;
}
