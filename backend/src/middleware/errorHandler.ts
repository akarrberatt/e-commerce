import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Bulunamadı.", code: "NOT_FOUND" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, ...(err.code && { code: err.code }) });
    return;
  }
  // Bozuk JSON gövdesi
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Geçersiz JSON.", code: "INVALID_JSON" });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Beklenmeyen bir hata oluştu.", code: "INTERNAL_ERROR" });
}
