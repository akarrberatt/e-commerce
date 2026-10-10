import { Router } from "express";
import * as controller from "./brands.controller.js";

export const brandsRouter = Router();

// Herkese açık, auth gerektirmez.
brandsRouter.get("/", controller.list);
