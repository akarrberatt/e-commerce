import { Router } from "express";
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendLimiter,
  resetPasswordLimiter,
} from "../../middleware/rateLimit.js";
import { validateBody } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schemas.js";
import { handleGoogleCallback, startGoogleLogin } from "./google.js";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, validateBody(registerSchema), controller.register);
authRouter.post("/verify-email", validateBody(verifyEmailSchema), controller.verifyEmail);
authRouter.post("/resend-verification", resendLimiter, validateBody(emailOnlySchema), controller.resendVerification);

authRouter.post("/forgot-password", forgotPasswordLimiter, validateBody(emailOnlySchema), controller.forgotPassword);
authRouter.post("/reset-password", resetPasswordLimiter, validateBody(resetPasswordSchema), controller.resetPassword);

authRouter.post("/login", loginLimiter, validateBody(loginSchema), controller.login);
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", controller.logout);

authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", handleGoogleCallback);
