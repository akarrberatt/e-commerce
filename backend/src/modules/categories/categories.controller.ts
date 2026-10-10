import type { Request, Response } from "express";
import * as categoriesService from "./categories.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ categories: await categoriesService.listCategoryTree() });
}
