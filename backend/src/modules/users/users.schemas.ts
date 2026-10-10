import { z } from "zod";
import { name } from "../auth/auth.schemas.js";

export const updateProfileSchema = z.object({ name });
