import type { NextFunction, Request, Response } from "express";
import type { z, ZodType } from "zod";
import { HttpError } from "../lib/httpError.js";

function parse<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(400, first?.message ?? "Geçersiz istek.", "VALIDATION_ERROR");
  }
  return result.data;
}

/** İstek gövdesini zod şemasıyla doğrular, geçerli veriyi req.body'ye yazar. */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = parse(schema, req.body);
    next();
  };
}

/** Query string'i zod şemasıyla doğrular. Express 5'te req.query salt okunur olduğu için sonucu döndürür. */
export function parseQuery<S extends ZodType>(schema: S, req: Request): z.infer<S> {
  return parse(schema, req.query);
}
