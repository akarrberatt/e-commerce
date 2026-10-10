import type { Request, Response } from "express";
import { parseQuery, parseUuid } from "../../middleware/validate.js";
import { listReviewsQuerySchema } from "./reviews.schemas.js";
import * as reviewsService from "./reviews.service.js";

type SlugParams = { slug: string };
type IdParams = { id: string };

const reviewId = (req: Request<IdParams>) => parseUuid(req.params.id, "Geçersiz değerlendirme kimliği.");

export async function list(req: Request<SlugParams>, res: Response) {
  const query = parseQuery(listReviewsQuerySchema, req);
  res.json(await reviewsService.listReviews(req.params.slug, query, req.auth?.sub ?? null));
}

export async function create(req: Request<SlugParams>, res: Response) {
  const review = await reviewsService.createReview(req.params.slug, req.auth!.sub, req.body);
  res.status(201).json({ review });
}

export async function update(req: Request<IdParams>, res: Response) {
  res.json({ review: await reviewsService.updateReview(reviewId(req), req.auth!.sub, req.body) });
}

export async function remove(req: Request<IdParams>, res: Response) {
  await reviewsService.deleteReview(reviewId(req), req.auth!.sub);
  res.status(204).end();
}
