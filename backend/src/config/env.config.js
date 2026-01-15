// backend/src/config/env.config.js

import dotenv from "dotenv";
import Joi from "joi";

// Load environment variables
dotenv.config();

/**
 * Environment variables schema
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  PORT: Joi.number().port().default(5000),

  MONGODB_URI: Joi.string()
    .uri()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .description("MongoDB connection string"),

  CORS_ORIGIN: Joi.string()
    .default("http://localhost:5173")
    .description("CORS allowed origins (comma-separated)"),

  LOG_LEVEL: Joi.string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .default("info"),
}).unknown();

/**
 * Validate environment variables
 */
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

/**
 * Validated environment configuration
 */
export const envConfig = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  MONGODB_URI: envVars.MONGODB_URI,
  CORS_ORIGIN: envVars.CORS_ORIGIN,
  LOG_LEVEL: envVars.LOG_LEVEL,
};
