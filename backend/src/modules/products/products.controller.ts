import type { Request, Response } from "express";
import { parseQuery } from "../../middleware/validate.js";
import { listProductsQuerySchema } from "./products.schemas.js";
import * as productsService from "./products.service.js";

export async function list(req: Request, res: Response) {
  res.json(await productsService.listProducts(parseQuery(listProductsQuerySchema, req)));
}

export async function detail(req: Request<{ slug: string }>, res: Response) {
  res.json({ product: await productsService.getProduct(req.params.slug) });
}
