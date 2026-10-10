import path from "node:path";
import { fileURLToPath } from "node:url";

// src/config (tsx) ve dist/config (build) için aynı: backend/public.
export const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public");
