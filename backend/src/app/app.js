// backend/src/app/app.js

import express from "express";
import helmet from "helmet";
import cors from "cors";
import "express-async-errors";
import rateLimit from "express-rate-limit";

import { corsOptions } from "../config/cors.config.js";
import { requestLogger } from "../middleware/logger.middleware.js";
import { errorHandler } from "../middleware/error.middleware.js";

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Health check (no /api prefix for infrastructure)
app.use("/health", healthRouter);

// API routes
app.use("/api/health", healthRouter);

// Global error handler (must be last)
app.use(errorHandler);
