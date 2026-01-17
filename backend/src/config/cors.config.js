// backend/src/config/cors.config.js

import { getEnvConfig } from "./env.config.js";

const envConfig = getEnvConfig();

const parseAllowedOrigins = () => {
  const origins = envConfig.CORS_ORIGIN.split(",").map((o) => o.trim());

  if (envConfig.NODE_ENV === "production" && origins.includes("*")) {
    throw new Error("Wildcard CORS origin is not allowed in production");
  }

  return origins;
};

const allowedOrigins = parseAllowedOrigins();

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

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
    "X-Request-ID",
  ],

  exposedHeaders: ["X-Total-Count", "X-Page-Count", "X-Request-ID"],

  maxAge: 86400,

  preflightContinue: false,
  optionsSuccessStatus: 204,
};
