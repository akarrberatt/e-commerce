import { Router } from "express";
import { HttpError } from "../../lib/httpError.js";
import { requireAuth } from "../../middleware/auth.js";
import { findUserById, toPublicUser } from "./users.repository.js";

export const usersRouter = Router();

// Korumalı endpoint örneği: geçerli access token ile giriş yapan kullanıcının bilgisi.
usersRouter.get("/me", requireAuth, async (req, res) => {
  const user = await findUserById(req.auth!.sub);
  if (!user) throw new HttpError(404, "Kullanıcı bulunamadı.", "NOT_FOUND");
  res.json({ user: toPublicUser(user) });
});
