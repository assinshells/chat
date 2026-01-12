// backend/src/config/database.config.js

import mongoose from "mongoose";
import { config } from "./index.js";
import { logger } from "../lib/logger.js";

/**
 * Connect to MongoDB
 */
export async function connectDatabase() {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(config.database.uri, config.database.options);

    logger.info(
      {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      "MongoDB connected successfully"
    );

    // Connection events
    mongoose.connection.on("error", (error) => {
      logger.error({ error }, "MongoDB connection error");
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.error({ error }, "MongoDB connection failed");
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error({ error }, "Error closing MongoDB connection");
    throw error;
  }
}
