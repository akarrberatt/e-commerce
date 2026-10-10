import { withTransaction } from "../../db/pool.js";
import { HttpError } from "../../lib/httpError.js";
import { findActiveProductIdBySlug } from "../products/products.repository.js";
import {
  deleteReview as deleteReviewRow,
  findReviewById,
  findReviewByProductAndUser,
  findReviewSummary,
  findReviews,
  insertReview,
  lockProduct,
  recalculateProductRating,
  updateReview as updateReviewRow,
  type ReviewRow,
} from "./reviews.repository.js";
import type { CreateReviewBody, ListReviewsQuery, UpdateReviewBody } from "./reviews.schemas.js";

/** Yorum sahibinin e-postası veya id'si asla dönmez; yalnızca kısaltılmış adı. */
export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  isMine: boolean;
  user: { displayName: string };
}

export interface ReviewList {
  items: Review[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { average: number; count: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };
  myReview: Review | null;
}

/** Gizlilik için soyadı baş harfine kısaltır: "Berat Akar" → "Berat A."; tek kelimeyse olduğu gibi. */
export function toDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts.pop()!;
  if (parts.length === 0) return last;
  const initial = [...last][0]!.toLocaleUpperCase("tr-TR");
  return `${parts.join(" ")} ${initial}.`;
}

function toReview(row: ReviewRow, viewerId: string | null): Review {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isMine: row.user_id === viewerId,
    user: { displayName: toDisplayName(row.user_name) },
  };
}

const productNotFound = () => new HttpError(404, "Ürün bulunamadı.", "NOT_FOUND");
// Başkasına ait yorum da "yok" sayılır (403 dönülmez, varlığı da sızdırılmaz).
const reviewNotFound = () => new HttpError(404, "Değerlendirme bulunamadı.", "NOT_FOUND");

export async function listReviews(slug: string, query: ListReviewsQuery, viewerId: string | null): Promise<ReviewList> {
  const productId = await findActiveProductIdBySlug(slug);
  if (!productId) throw productNotFound();

  const { page, limit } = query;
  const [rows, summary, mine] = await Promise.all([
    findReviews(productId, query.sort, limit, (page - 1) * limit),
    findReviewSummary(productId),
    viewerId ? findReviewByProductAndUser(productId, viewerId) : null,
  ]);

  return {
    items: rows.map((row) => toReview(row, viewerId)),
    pagination: { page, limit, total: summary.count, totalPages: Math.ceil(summary.count / limit) },
    summary: {
      average: summary.average,
      count: summary.count,
      distribution: { "1": summary.r1, "2": summary.r2, "3": summary.r3, "4": summary.r4, "5": summary.r5 },
    },
    myReview: mine ? toReview(mine, viewerId) : null,
  };
}

export async function createReview(slug: string, userId: string, body: CreateReviewBody): Promise<Review> {
  // TODO: Sipariş modülü eklenince yalnızca ürünü satın almış kullanıcılar değerlendirme yazabilmeli.
  return withTransaction(async (db) => {
    const productId = await lockProduct({ slug }, true, db);
    if (!productId) throw productNotFound();

    const id = await insertReview(productId, userId, body.rating, body.comment, db);
    if (!id) {
      throw new HttpError(
        409,
        "Bu ürünü zaten değerlendirdiniz. Mevcut değerlendirmenizi düzenleyebilirsiniz.",
        "REVIEW_EXISTS",
      );
    }
    await recalculateProductRating(productId, db);
    return toReview((await findReviewById(id, db))!, userId);
  });
}

export async function updateReview(id: string, userId: string, body: UpdateReviewBody): Promise<Review> {
  return withTransaction(async (db) => {
    const existing = await findReviewById(id, db);
    if (!existing || existing.user_id !== userId) throw reviewNotFound();

    await lockProduct({ id: existing.product_id }, false, db);
    await updateReviewRow(id, body.rating, body.comment, db);
    await recalculateProductRating(existing.product_id, db);

    // Kilidi beklerken yorum başka bir istekle silinmiş olabilir.
    const updated = await findReviewById(id, db);
    if (!updated) throw reviewNotFound();
    return toReview(updated, userId);
  });
}

export async function deleteReview(id: string, userId: string): Promise<void> {
  await withTransaction(async (db) => {
    const existing = await findReviewById(id, db);
    if (!existing || existing.user_id !== userId) throw reviewNotFound();

    await lockProduct({ id: existing.product_id }, false, db);
    await deleteReviewRow(id, db);
    await recalculateProductRating(existing.product_id, db);
  });
}
