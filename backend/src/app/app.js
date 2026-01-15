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

// Feature routes
import { healthRouter } from "../routes/index.js";

/**
 * Express application instance
 */
export const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Rate limiting - BEFORE body parsing
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Allow health checks to bypass rate limiting in some cases
    // But still apply a separate, more lenient limit
    return false;
  },
});

// Separate rate limiter for health endpoints
const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "Too many health check requests",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Health check (no /api prefix for infrastructure)
app.use("/health", healthLimiter, healthRouter);

// API routes
app.use("/api/health", healthLimiter, healthRouter);

// 404 handler (MUST be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);
