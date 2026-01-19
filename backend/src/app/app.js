// backend/src/app/app.js

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import "express-async-errors";
import rateLimit from "express-rate-limit";

import { corsOptions } from "../config/cors.config.js";
import { requestLogger } from "../middleware/logger.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "../middleware/error.middleware.js";
import { healthRouter } from "../routes/health.routes.js";
import { authRouter } from "../routes/auth.routes.js";
import { adminRouter } from "../routes/admin.routes.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/health"),
});

const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: "Too many health check requests",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(requestLogger);

app.use("/health", healthLimiter, healthRouter);
app.use("/api/health", healthLimiter, healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
