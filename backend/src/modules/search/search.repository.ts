import { pool, type DbClient } from "../../db/pool.js";
import { likePatterns, sqlNormalize } from "../../lib/search.js";
import { FIRST_IMAGE_JOIN } from "../products/products.repository.js";

export interface SuggestProductRow {
  id: string;
  slug: string;
  name: string;
  price_kurus: number;
  image: string | null;
}

export interface SuggestNameRow {
  name: string;
  slug: string;
}

// Her tabloya LIMIT'li tek sorgu. $1 = "%q%", $2 = "q%"; adı q ile başlayanlar önce gelir.
const matches = (column: string) => `${sqlNormalize(column)} LIKE $1 ESCAPE '\\'`;
const prefixFirst = (column: string) => `(${sqlNormalize(column)} LIKE $2 ESCAPE '\\') DESC`;

export async function suggestProducts(query: string, limit: number, db: DbClient = pool) {
  const { contains, startsWith } = likePatterns(query);
  const { rows } = await db.query<SuggestProductRow>(
    `SELECT p.id, p.slug, p.name, p.price_kurus, img.url AS image
       FROM products p ${FIRST_IMAGE_JOIN}
      WHERE p.is_active AND ${matches("p.name")}
      ORDER BY ${prefixFirst("p.name")}, p.name, p.id
      LIMIT $3`,
    [contains, startsWith, limit],
  );
  return rows;
}

export async function suggestCategories(query: string, limit: number, db: DbClient = pool) {
  const { contains, startsWith } = likePatterns(query);
  const { rows } = await db.query<SuggestNameRow>(
    `SELECT c.name, c.slug
       FROM categories c
      WHERE ${matches("c.name")}
      ORDER BY ${prefixFirst("c.name")}, c.name, c.id
      LIMIT $3`,
    [contains, startsWith, limit],
  );
  return rows;
}

// Yalnızca aktif ürünü olan markalar önerilir (boş sonuç sayfasına götürmesin).
export async function suggestBrands(query: string, limit: number, db: DbClient = pool) {
  const { contains, startsWith } = likePatterns(query);
  const { rows } = await db.query<SuggestNameRow>(
    `SELECT b.name, b.slug
       FROM brands b
      WHERE ${matches("b.name")}
        AND EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id AND p.is_active)
      ORDER BY ${prefixFirst("b.name")}, b.name, b.id
      LIMIT $3`,
    [contains, startsWith, limit],
  );
  return rows;
}
