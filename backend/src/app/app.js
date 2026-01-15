// backend/src/app/app.js

import express from "express";
import helmet from "helmet";
import cors from "cors";
import "express-async-errors";
import rateLimit from "express-rate-limit";

import { corsOptions } from "../config/cors.config.js";
import { requestLogger } from "../middleware/logger.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "../middleware/error.middleware.js";
import { healthRouter } from "../routes/index.js";
import { skipLogger } from "../middleware/logger.middleware.js";

export const app = express();

// ✅ Не логировать health checks (слишком много шума)
app.use(skipLogger(["/health", "/metrics"]));

// ============================================
// 1. Security & Parsing (до логирования)
// ============================================
app.use(helmet());
app.use(cors(corsOptions));

// Body parsing (до логирования, чтобы логировать тело)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// 2. Rate Limiting (до роутов)
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: "Too many health check requests",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ============================================
// 3. Request Logging (после parsing)
// ============================================
app.use(requestLogger);

// ============================================
// 4. Routes (в правильном порядке)
// ============================================

// Health endpoints (без /api префикса для инфраструктуры)
app.use("/health", healthLimiter, healthRouter);

// API routes (с префиксом /api)
app.use("/api/health", healthLimiter, healthRouter);

// ✅ 404 handler - ПОСЛЕ всех роутов, ПЕРЕД error handler
app.use(notFoundHandler);

// ✅ Global error handler - ПОСЛЕДНИЙ
app.use(errorHandler);
