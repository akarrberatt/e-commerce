import { pool, type DbClient } from "../../db/pool.js";
import type { ReviewSort } from "./reviews.schemas.js";

export interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewSummaryRow {
  average: number;
  count: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  r5: number;
}

const REVIEW_SELECT = `
  SELECT r.id, r.product_id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at, r.updated_at
    FROM reviews r
    JOIN users u ON u.id = r.user_id`;

// Eşitlikte tarih ve id ile ikincil sıralama: sayfalama kararlı olsun.
const ORDER_BY: Record<ReviewSort, string> = {
  newest: "r.created_at DESC, r.id DESC",
  rating_desc: "r.rating DESC, r.created_at DESC, r.id DESC",
  rating_asc: "r.rating ASC, r.created_at DESC, r.id DESC",
};

// Ortalama: bir ondalık, yorum yoksa 0. Özet ve products.rating_avg aynı ifadeyle hesaplanır.
const AVERAGE = "COALESCE(round(avg(rating), 1), 0)";

export async function findReviews(
  productId: string,
  sort: ReviewSort,
  limit: number,
  offset: number,
  db: DbClient = pool,
) {
  const { rows } = await db.query<ReviewRow>(
    `${REVIEW_SELECT} WHERE r.product_id = $1 ORDER BY ${ORDER_BY[sort]} LIMIT $2 OFFSET $3`,
    [productId, limit, offset],
  );
  return rows;
}

export async function findReviewSummary(productId: string, db: DbClient = pool) {
  const { rows } = await db.query<ReviewSummaryRow>(
    `SELECT ${AVERAGE}::float8 AS average,
            count(*)::int AS count,
            (count(*) FILTER (WHERE rating = 1))::int AS r1,
            (count(*) FILTER (WHERE rating = 2))::int AS r2,
            (count(*) FILTER (WHERE rating = 3))::int AS r3,
            (count(*) FILTER (WHERE rating = 4))::int AS r4,
            (count(*) FILTER (WHERE rating = 5))::int AS r5
       FROM reviews
      WHERE product_id = $1`,
    [productId],
  );
  return rows[0]!;
}

export async function findReviewById(id: string, db: DbClient = pool) {
  const { rows } = await db.query<ReviewRow>(`${REVIEW_SELECT} WHERE r.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findReviewByProductAndUser(productId: string, userId: string, db: DbClient = pool) {
  const { rows } = await db.query<ReviewRow>(`${REVIEW_SELECT} WHERE r.product_id = $1 AND r.user_id = $2`, [
    productId,
    userId,
  ]);
  return rows[0] ?? null;
}

/**
 * Ürün satırını kilitler: aynı ürüne eşzamanlı yorum işlemleri sıraya girer, böylece
 * recalculateProductRating her zaman güncel yorumları görür. FOR NO KEY UPDATE, favori
 * eklemeyi (FK kontrolü) engellemez. Ürün yoksa (veya onlyActive ile pasifse) null döner.
 */
export async function lockProduct(where: { slug: string } | { id: string }, onlyActive: boolean, db: DbClient) {
  const [column, value] = "slug" in where ? ["slug", where.slug] : ["id", where.id];
  const { rows } = await db.query<{ id: string }>(
    `SELECT id FROM products WHERE ${column} = $1 ${onlyActive ? "AND is_active" : ""} FOR NO KEY UPDATE`,
    [value],
  );
  return rows[0]?.id ?? null;
}

/** Kullanıcının bu ürüne zaten yorumu varsa null döner. */
export async function insertReview(
  productId: string,
  userId: string,
  rating: number,
  comment: string,
  db: DbClient = pool,
) {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, user_id) DO NOTHING
     RETURNING id`,
    [productId, userId, rating, comment],
  );
  return rows[0]?.id ?? null;
}

/** Verilmeyen (undefined) alanlar değişmez. */
export async function updateReview(
  id: string,
  rating: number | undefined,
  comment: string | undefined,
  db: DbClient = pool,
) {
  await db.query(
    `UPDATE reviews
        SET rating = COALESCE($2, rating), comment = COALESCE($3, comment), updated_at = now()
      WHERE id = $1`,
    [id, rating ?? null, comment ?? null],
  );
}

export async function deleteReview(id: string, db: DbClient = pool) {
  await db.query("DELETE FROM reviews WHERE id = $1", [id]);
}

export async function recalculateProductRating(productId: string, db: DbClient = pool) {
  await db.query(
    `UPDATE products
        SET rating_avg = s.average, rating_count = s.count
       FROM (SELECT ${AVERAGE} AS average, count(*)::int AS count FROM reviews WHERE product_id = $1) s
      WHERE id = $1`,
    [productId],
  );
}
