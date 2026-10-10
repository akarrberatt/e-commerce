import { Router } from "express";
import * as controller from "./products.controller.js";

export const productsRouter = Router();

// Herkese açık, auth gerektirmez.
productsRouter.get("/", controller.list);
productsRouter.get("/:slug", controller.detail);
