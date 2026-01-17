// backend/src/config/env.config.js

import dotenv from "dotenv";
import Joi from "joi";

let envConfig = null;

export function initializeEnv() {
  if (envConfig) return envConfig;

  const result = dotenv.config();

  if (result.error) {
    console.error("❌ Failed to load .env file:", result.error.message);
    process.exit(1);
  }

  const envSchema = Joi.object({
    NODE_ENV: Joi.string()
      .valid("development", "production", "test", "staging")
      .default("development"),
    PORT: Joi.number().port().default(5000),
    MONGODB_URI: Joi.string()
      .uri()
      .pattern(/^mongodb(\+srv)?:\/\//)
      .required(),
    CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
    LOG_LEVEL: Joi.string()
      .valid("fatal", "error", "warn", "info", "debug", "trace")
      .default("info"),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default("15m"),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    SUPERADMIN_PASSWORD: Joi.string().min(8).optional(),
    FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
  }).unknown(true);

  const { error, value: envVars } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details
      .map((detail) => `  - ${detail.path.join(".")}: ${detail.message}`)
      .join("\n");

    console.error("❌ Environment validation failed:\n" + errorMessages);
    console.error("\n💡 Check your .env file\n");
    process.exit(1);
  }

  envConfig = {
    NODE_ENV: envVars.NODE_ENV,
    PORT: envVars.PORT,
    MONGODB_URI: envVars.MONGODB_URI,
    CORS_ORIGIN: envVars.CORS_ORIGIN,
    LOG_LEVEL: envVars.LOG_LEVEL,
    JWT_SECRET: envVars.JWT_SECRET,
    JWT_EXPIRES_IN: envVars.JWT_EXPIRES_IN,
    RATE_LIMIT_WINDOW_MS: envVars.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: envVars.RATE_LIMIT_MAX_REQUESTS,
    SUPERADMIN_PASSWORD: envVars.SUPERADMIN_PASSWORD,
    FRONTEND_URL: envVars.FRONTEND_URL,
  };

  if (envConfig.NODE_ENV === "production") {
    validateProduction(envConfig);
  }

  if (envConfig.NODE_ENV === "development") {
    logDevelopmentConfig(envConfig);
  }

  return envConfig;
}

function validateProduction(config) {
  const issues = [];

  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
    issues.push("JWT_SECRET must be at least 32 characters");
  }

  if (config.CORS_ORIGIN.includes("localhost")) {
    issues.push("CORS_ORIGIN should not include localhost in production");
  }

  if (issues.length > 0) {
    console.error("❌ Production validation failed:");
    console.error(issues.map((i) => `  - ${i}`).join("\n"));
    process.exit(1);
  }
}

function logDevelopmentConfig(config) {
  console.log("✅ Environment configuration loaded:");
  console.log(`  - NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  - PORT: ${config.PORT}`);
  console.log(
    `  - MONGODB_URI: ${config.MONGODB_URI.replace(/\/\/.*@/, "//***@")}`,
  );
  console.log(`  - CORS_ORIGIN: ${config.CORS_ORIGIN}`);
  console.log(`  - LOG_LEVEL: ${config.LOG_LEVEL}`);
  console.log(`  - JWT_SECRET: ${config.JWT_SECRET.substring(0, 8)}...`);
}

export function getEnvConfig() {
  if (!envConfig) {
    throw new Error("Environment not initialized. Call initializeEnv() first.");
  }
  return envConfig;
}
