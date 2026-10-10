import type { Request, Response } from "express";
import { z } from "zod";
import { parseQuery } from "../../middleware/validate.js";
import { categoryParam } from "../products/products.schemas.js";
import * as brandsService from "./brands.service.js";

const listBrandsQuerySchema = z.object({ category: categoryParam });

export async function list(req: Request, res: Response) {
  const { category } = parseQuery(listBrandsQuerySchema, req);
  res.json({ brands: await brandsService.listBrands(category) });
}
