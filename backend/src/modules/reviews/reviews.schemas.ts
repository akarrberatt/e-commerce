import { z } from "zod";
import { emptyToUndefined, intParam, pageParam } from "../products/products.schemas.js";

const RATING_MESSAGE = "Puan 1 ile 5 arasında bir tam sayı olmalı.";
const rating = z
  .number({ error: RATING_MESSAGE })
  .int(RATING_MESSAGE)
  .min(1, RATING_MESSAGE)
  .max(5, RATING_MESSAGE);

const comment = z
  .string({ error: "Yorum metin olmalı." })
  .trim()
  .max(2000, "Yorum en fazla 2000 karakter olabilir.");

export const createReviewSchema = z.object({ rating, comment: comment.default("") });

export const updateReviewSchema = z
  .object({ rating: rating.optional(), comment: comment.optional() })
  .refine((body) => body.rating !== undefined || body.comment !== undefined, {
    error: "Puan veya yorumdan en az biri gönderilmeli.",
  });

export const REVIEW_SORTS = ["newest", "rating_desc", "rating_asc"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const listReviewsQuerySchema = z.object({
  page: pageParam,
  limit: intParam("Sayfa boyutu", 1, 50, 10),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(REVIEW_SORTS, { error: "Geçersiz sıralama seçeneği." }).default("newest"),
  ),
});

export type CreateReviewBody = z.infer<typeof createReviewSchema>;
export type UpdateReviewBody = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
