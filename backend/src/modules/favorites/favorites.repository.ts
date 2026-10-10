import { pool, type DbClient } from "../../db/pool.js";
import { SUMMARY_JOINS, summaryColumns, type ProductRow } from "../products/products.repository.js";

export async function findActiveProductFavoriteCount(productId: string, db: DbClient = pool) {
  const { rows } = await db.query<{ favorite_count: number }>(
    "SELECT favorite_count FROM products WHERE id = $1 AND is_active",
    [productId],
  );
  return rows[0]?.favorite_count ?? null;
}

/** Favori zaten varsa false döner (satır eklenmez). */
export async function insertFavorite(userId: string, productId: string, db: DbClient = pool) {
  const { rowCount } = await db.query(
    "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, productId],
  );
  return rowCount === 1;
}

/** Favori yoksa false döner. */
export async function deleteFavorite(userId: string, productId: string, db: DbClient = pool) {
  const { rowCount } = await db.query("DELETE FROM favorites WHERE user_id = $1 AND product_id = $2", [
    userId,
    productId,
  ]);
  return rowCount === 1;
}

export async function adjustFavoriteCount(productId: string, delta: 1 | -1, db: DbClient = pool) {
  const { rows } = await db.query<{ favorite_count: number }>(
    "UPDATE products SET favorite_count = favorite_count + $2 WHERE id = $1 RETURNING favorite_count",
    [productId, delta],
  );
  return rows[0]!.favorite_count;
}

// En son eklenen önce; pasif ürünler listelenmez.
export async function findFavoriteProducts(userId: string, limit: number, offset: number, db: DbClient = pool) {
  const { rows } = await db.query<ProductRow>(
    `SELECT ${summaryColumns("$1")}
       FROM favorites fav
       JOIN products p ON p.id = fav.product_id ${SUMMARY_JOINS}
      WHERE fav.user_id = $1 AND p.is_active
      ORDER BY fav.created_at DESC, p.id ASC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
}

export async function countFavoriteProducts(userId: string, db: DbClient = pool) {
  const { rows } = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total
       FROM favorites fav
       JOIN products p ON p.id = fav.product_id
      WHERE fav.user_id = $1 AND p.is_active`,
    [userId],
  );
  return rows[0]?.total ?? 0;
}
