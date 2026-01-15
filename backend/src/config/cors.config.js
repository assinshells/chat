// backend/src/config/cors.config.js

import { envConfig } from "./env.config.js";

/**
 * Parse allowed origins
 */
const parseAllowedOrigins = () => {
  const origins = envConfig.CORS_ORIGIN.split(",").map((o) => o.trim());

  // Remove wildcards in production
  if (envConfig.NODE_ENV === "production" && origins.includes("*")) {
    throw new Error("Wildcard CORS origin is not allowed in production");
  }

  return origins;
};

const allowedOrigins = parseAllowedOrigins();

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = envConfig.CORS_ORIGIN.split(",").map((o) =>
      o.trim()
    );

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  exposedHeaders: ["X-Total-Count", "X-Page-Count"],

  maxAge: 86400, // 24 hours

  // Prevent credentials with wildcard origin
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
