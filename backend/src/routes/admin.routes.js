// backend/src/routes/admin.routes.js

import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import {
  validate,
  validateQuery,
} from "../middleware/validation.middleware.js";
import Joi from "joi";

export const adminRouter = Router();

// All admin routes require authentication and superadmin role
adminRouter.use(authenticate);
adminRouter.use(requireRole("superadmin"));

// Dashboard
adminRouter.get("/dashboard", adminController.getDashboard);

// Users management
adminRouter.get(
  "/users",
  validateQuery(
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().allow("").optional(),
      role: Joi.string().valid("user", "superadmin").optional(),
      isActive: Joi.string().valid("true", "false").optional(),
    })
  ),
  adminController.getUsers
);

adminRouter.patch(
  "/users/:id/role",
  validate(
    Joi.object({
      role: Joi.string().valid("user", "superadmin").required(),
    })
  ),
  adminController.updateUserRole
);

adminRouter.patch(
  "/users/:id/status",
  validate(
    Joi.object({
      isActive: Joi.boolean().required(),
    })
  ),
  adminController.updateUserStatus
);

// Extended health check
adminRouter.get("/health", adminController.getHealthInfo);
