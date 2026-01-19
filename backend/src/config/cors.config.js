// backend/src/config/cors.config.js

import { getEnvConfig } from "./env.config.js";

let allowedOrigins = null;

const parseAllowedOrigins = () => {
  if (allowedOrigins) return allowedOrigins;

  const envConfig = getEnvConfig();
  const origins = envConfig.CORS_ORIGIN.split(",").map((o) => o.trim());

  if (envConfig.NODE_ENV === "production") {
    if (origins.includes("*")) {
      throw new Error(
        "❌ Security Error: Wildcard CORS origin is not allowed in production",
      );
    }

    origins.forEach((origin) => {
      if (origin === "localhost" || origin.includes("localhost")) {
        throw new Error(
          "❌ Security Error: localhost is not allowed in production CORS",
        );
      }
    });
  }

  allowedOrigins = origins;
  return origins;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const allowed = parseAllowedOrigins();

    if (allowed.includes("*") || allowed.includes(origin)) {
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
    "X-Request-ID",
  ],

  exposedHeaders: ["X-Total-Count", "X-Page-Count", "X-Request-ID"],

  maxAge: 86400,

  preflightContinue: false,
  optionsSuccessStatus: 204,
};
