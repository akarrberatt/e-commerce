import { Router } from "express";
import { loginLimiter, registerLimiter, resendLimiter } from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, registerSchema, resendVerificationSchema, verifyEmailSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validateBody(registerSchema), controller.register);
authRouter.post("/verify-email", validateBody(verifyEmailSchema), controller.verifyEmail);
authRouter.post(
  "/resend-verification",
  resendLimiter,
  validateBody(resendVerificationSchema),
  controller.resendVerification,
);
authRouter.post("/login", loginLimiter, validateBody(loginSchema), controller.login);
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", controller.logout);
