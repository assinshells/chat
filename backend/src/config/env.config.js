// backend/src/config/env.config.js

import dotenv from "dotenv";
import Joi from "joi";
import { logger } from "../lib/logger.js";

// ✅ Load environment variables
const result = dotenv.config();

if (result.error) {
  console.error("❌ Failed to load .env file:", result.error);
  process.exit(1);
}

/**
 * Environment variables schema with detailed validation
 */
const envSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid("development", "production", "test", "staging")
    .default("development")
    .description("Application environment"),

  // Server configuration
  PORT: Joi.number().port().default(5000).description("Server port"),

  // Database
  MONGODB_URI: Joi.string()
    .uri()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .description("MongoDB connection string")
    .example("mongodb://localhost:27017/myapp"),

  // CORS
  CORS_ORIGIN: Joi.string()
    .default("http://localhost:5173")
    .description("CORS allowed origins (comma-separated)")
    .example("http://localhost:3000,https://myapp.com"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .default("info")
    .description("Logging level"),

  // JWT (if used)
  JWT_SECRET: Joi.string()
    .min(32)
    .when("NODE_ENV", {
      is: "production",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description("JWT secret key (required in production)"),

  JWT_EXPIRES_IN: Joi.string().default("7d").description("JWT expiration time"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(15 * 60 * 1000)
    .description("Rate limit window in milliseconds"),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100)
    .description("Maximum requests per window"),
})
  .unknown(true) // ✅ Allow other env variables
  .required();

/**
 * Validate environment variables
 */
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false, // ✅ Show all errors
  stripUnknown: false, // ✅ Keep other variables
});

if (error) {
  const errorMessages = error.details.map((detail) => {
    return `  - ${detail.path.join(".")}: ${detail.message}`;
  });

  console.error("❌ Environment validation failed:");
  console.error(errorMessages.join("\n"));
  console.error(
    "\n💡 Please check your .env file and ensure all required variables are set.\n"
  );

  process.exit(1);
}

/**
 * Validated and typed environment configuration
 */
export const envConfig = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  MONGODB_URI: envVars.MONGODB_URI,
  CORS_ORIGIN: envVars.CORS_ORIGIN,
  LOG_LEVEL: envVars.LOG_LEVEL,
  JWT_SECRET: envVars.JWT_SECRET,
  JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN,
  RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
};

/**
 * Validate production-specific requirements
 */
if (envConfig.NODE_ENV === "production") {
  const productionRequirements = [];

  if (!envConfig.JWT_SECRET || envConfig.JWT_SECRET.length < 32) {
    productionRequirements.push("JWT_SECRET must be at least 32 characters");
  }

  if (envConfig.CORS_ORIGIN.includes("localhost")) {
    productionRequirements.push(
      "CORS_ORIGIN should not include localhost in production"
    );
  }

  if (productionRequirements.length > 0) {
    console.error("❌ Production validation failed:");
    console.error(productionRequirements.map((r) => `  - ${r}`).join("\n"));
    process.exit(1);
  }
}

// ✅ Log configuration (hide sensitive data)
if (envConfig.NODE_ENV === "development") {
  console.log("✅ Environment configuration loaded:");
  console.log(`  - NODE_ENV: ${envConfig.NODE_ENV}`);
  console.log(`  - PORT: ${envConfig.PORT}`);
  console.log(
    `  - MONGODB_URI: ${envConfig.MONGODB_URI.replace(/\/\/.*@/, "//***@")}`
  );
  console.log(`  - CORS_ORIGIN: ${envConfig.CORS_ORIGIN}`);
  console.log(`  - LOG_LEVEL: ${envConfig.LOG_LEVEL}`);
}
