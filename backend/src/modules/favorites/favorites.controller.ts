import type { Request, Response } from "express";
import { parseQuery, parseUuid } from "../../middleware/validate.js";
import { productPaginationSchema } from "../products/products.schemas.js";
import * as favoritesService from "./favorites.service.js";

type ProductParams = { productId: string };

const productId = (req: Request<ProductParams>) => parseUuid(req.params.productId, "Geçersiz ürün kimliği.");

export async function list(req: Request, res: Response) {
  const { page, limit } = parseQuery(productPaginationSchema, req);
  res.json(await favoritesService.listFavorites(req.auth!.sub, page, limit));
}

export async function add(req: Request<ProductParams>, res: Response) {
  res.json(await favoritesService.addFavorite(req.auth!.sub, productId(req)));
}

export async function remove(req: Request<ProductParams>, res: Response) {
  res.json(await favoritesService.removeFavorite(req.auth!.sub, productId(req)));
}
