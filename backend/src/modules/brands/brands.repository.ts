import { pool, type DbClient } from "../../db/pool.js";
import { sqlNormalize } from "../../lib/search.js";

export interface BrandCountRow {
  name: string;
  slug: string;
  product_count: number;
}

/** Aktif ürünü olan markalar ve aktif ürün sayıları; categoryIds verilirse yalnızca o kategorilerdeki ürünler sayılır. */
export async function findBrandsWithProductCount(categoryIds: string[] | null, db: DbClient = pool) {
  const { rows } = await db.query<BrandCountRow>(
    `SELECT b.name, b.slug, count(*)::int AS product_count
       FROM brands b
       JOIN products p ON p.brand_id = b.id
      WHERE p.is_active AND ($1::uuid[] IS NULL OR p.category_id = ANY($1::uuid[]))
      GROUP BY b.id
      ORDER BY ${sqlNormalize("b.name")}, b.name`,
    [categoryIds],
  );
  return rows;
}
