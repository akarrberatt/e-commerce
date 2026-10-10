import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as controller from "./reviews.controller.js";
import { updateReviewSchema } from "./reviews.schemas.js";

// Ürüne bağlı uçlar (GET/POST /products/:slug/reviews) products.routes.ts içinde tanımlıdır.
export const reviewsRouter = Router();

reviewsRouter.patch("/:id", requireAuth, validateBody(updateReviewSchema), controller.update);
reviewsRouter.delete("/:id", requireAuth, controller.remove);
