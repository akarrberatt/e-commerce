import type { Request, Response } from "express";
import { z } from "zod";
import { parseQuery } from "../../middleware/validate.js";
import * as searchService from "./search.service.js";

const suggestQuerySchema = z.object({
  q: z
    .string({ error: "Arama metni geçersiz." })
    .trim()
    .max(100, "Arama metni en fazla 100 karakter olabilir.")
    .default(""),
});

export async function suggest(req: Request, res: Response) {
  const { q } = parseQuery(suggestQuerySchema, req);
  res.json(await searchService.suggest(q));
}
