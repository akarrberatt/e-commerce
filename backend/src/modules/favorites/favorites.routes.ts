import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { favoriteLimiter } from "../../middleware/rateLimit.js";
import * as controller from "./favorites.controller.js";

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get("/", controller.list);
favoritesRouter.put("/:productId", favoriteLimiter, controller.add);
favoritesRouter.delete("/:productId", favoriteLimiter, controller.remove);
