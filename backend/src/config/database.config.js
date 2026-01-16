// backend/src/config/database.config.js

import mongoose from "mongoose";
import { config } from "./index.js";
import { logger } from "../lib/logger.js";

export const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
};

export const getDBState = () => mongoose.connection.readyState;

export const isConnected = () => getDBState() === DB_STATES.CONNECTED;

export async function connectDatabase(retries = 5, delay = 5000) {
  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;

      logger.info(
        {
          attempt,
          maxRetries: retries,
          uri: config.database.uri.replace(/\/\/.*@/, "//***@"),
        },
        "Attempting MongoDB connection"
      );

      mongoose.set("strictQuery", false);

      await mongoose.connect(config.database.uri, config.database.options);

      await mongoose.connection.db.admin().ping();

      logger.info(
        {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          attempt,
        },
        "MongoDB connected successfully"
      );

      setupDBListeners();

      return;
    } catch (error) {
      logger.error(
        {
          error,
          attempt,
          maxRetries: retries,
        },
        "MongoDB connection failed"
      );

      if (attempt >= retries) {
        logger.fatal("MongoDB connection failed after max retries");
        throw error;
      }

      const waitTime = delay * Math.pow(2, attempt - 1);
      logger.info(
        { waitTime, nextAttempt: attempt + 1 },
        "Retrying MongoDB connection"
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

function setupDBListeners() {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection established");
  });

  mongoose.connection.on("error", (error) => {
    logger.error({ error }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");

    setTimeout(() => {
      logger.info("Attempting to reconnect to MongoDB");
      connectDatabase(3, 3000).catch((err) => {
        logger.fatal({ error: err }, "Failed to reconnect to MongoDB");
      });
    }, 5000);
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
}

export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully");
  } catch (error) {
    logger.error({ error }, "Error closing MongoDB connection");
    throw error;
  }
}
