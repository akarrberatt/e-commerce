import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/httpError.js";

/** İstek gövdesini zod şemasıyla doğrular, geçerli veriyi req.body'ye yazar. */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      throw new HttpError(400, first?.message ?? "Geçersiz istek.", "VALIDATION_ERROR");
    }
    req.body = result.data;
    next();
  };
}
