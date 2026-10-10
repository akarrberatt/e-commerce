import { Router } from "express";
import * as controller from "./categories.controller.js";

export const categoriesRouter = Router();

// Herkese açık, auth gerektirmez.
categoriesRouter.get("/", controller.list);
