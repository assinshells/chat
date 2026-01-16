// backend/src/routes/auth.routes.js

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { authValidators } from "../utils/auth.validators.js";

export const authRouter = Router();

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
authRouter.get("/captcha", authController.getCaptcha);

authRouter.post(
  "/register",
  authLimiter,
  validate(authValidators.register),
  authController.register
);

authRouter.post(
  "/login",
  authLimiter,
  validate(authValidators.login),
  authController.login
);

authRouter.post(
  "/refresh",
  validate(authValidators.refresh),
  authController.refresh
);

authRouter.post("/logout", authController.logout);

// Password reset
authRouter.post(
  "/password/request-reset",
  passwordLimiter,
  validate(authValidators.requestPasswordReset),
  authController.requestPasswordReset
);

authRouter.post(
  "/password/reset",
  passwordLimiter,
  validate(authValidators.resetPassword),
  authController.resetPassword
);

// Protected routes
authRouter.get("/me", authenticate, authController.getCurrentUser);

authRouter.post("/logout-all", authenticate, authController.logoutAll);

authRouter.post(
  "/password/change",
  authenticate,
  validate(authValidators.changePassword),
  authController.changePassword
);
