import { Router } from "express";
import { suggestLimiter } from "../../middleware/rateLimit.js";
import * as controller from "./search.controller.js";

export const searchRouter = Router();

// Herkese açık, auth gerektirmez. Her tuş vuruşunda çağrıldığı için IP başına limitlidir.
searchRouter.get("/suggest", suggestLimiter, controller.suggest);
