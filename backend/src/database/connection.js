// backend/src/database/connection.js

import mongoose from "mongoose";
import { config } from "../config/index.js";
import { logger } from "../lib/logger.js";

/**
 * Database connection state
 */
export const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
};

/**
 * Get current database connection state
 */
export const getDBState = () => {
  return mongoose.connection.readyState;
};

/**
 * Check if database is connected
 */
export const isConnected = () => {
  return getDBState() === DB_STATES.CONNECTED;
};

/**
 * Connect to MongoDB with retry logic
 */
export const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.database.uri, config.database.options);
      logger.info("MongoDB connected successfully");
      return;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${i + 1}/${retries} failed:`,
        error.message
      );

      if (i < retries - 1) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Setup database event listeners
 */
export const setupDBListeners = () => {
  mongoose.connection.on("connected", () => {
    logger.info({
      msg: "MongoDB connected",
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  });

  mongoose.connection.on("error", (error) => {
    logger.error({ error }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  // Handle application termination
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  });
};
