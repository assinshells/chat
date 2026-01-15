// backend/src/index.js

import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.config.js";
import { createServer } from "./app/server.js";

/**
 * Bootstrap application
 */
async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();

    // Create and start server
    const server = createServer();

    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          nodeVersion: process.version,
        },
        "Server started successfully"
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info({ signal }, "Received shutdown signal");

      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error({ error: err }, "Error closing HTTP server");
        } else {
          logger.info("HTTP server closed");
        }

        try {
          await disconnectDatabase();
          logger.info("Application shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error({ error }, "Error during shutdown");
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      logger.fatal({ error }, "Uncaught exception");
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.fatal({ reason, promise }, "Unhandled rejection");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, "Application bootstrap failed");
    process.exit(1);
  }
}

// Start application
bootstrap();
