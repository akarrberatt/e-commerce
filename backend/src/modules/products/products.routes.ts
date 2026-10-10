import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import { createReviewLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import * as reviewsController from "../reviews/reviews.controller.js";
import { createReviewSchema } from "../reviews/reviews.schemas.js";
import * as controller from "./products.controller.js";

export const productsRouter = Router();

// Herkese açık; token gelirse kişiye özel alanlar (isFavorite, myReview) doldurulur.
productsRouter.get("/", optionalAuth, controller.list);
productsRouter.get("/:slug", optionalAuth, controller.detail);
productsRouter.get("/:slug/reviews", optionalAuth, reviewsController.list);

productsRouter.post(
  "/:slug/reviews",
  requireAuth,
  createReviewLimiter,
  validateBody(createReviewSchema),
  reviewsController.create,
);
