// backend/src/index.js

import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.config.js";
import { createServer } from "./app/server.js";

/**
 * Application state
 */
let server = null;
let isShuttingDown = false;

/**
 * Bootstrap application
 */
async function bootstrap() {
  try {
    logger.info("🚀 Starting application...");

    // ✅ 1. Connect to database (with retry)
    logger.info("📦 Connecting to database...");
    await connectDatabase();

    // ✅ 2. Create and start server
    logger.info("🌐 Starting HTTP server...");
    server = createServer();

    server.listen(config.port, () => {
      logger.info(
        {
          port: config.port,
          env: config.env,
          nodeVersion: process.version,
          pid: process.pid,
        },
        "✅ Server started successfully"
      );
      // ✅ Log startup banner
      console.log(`
╔════════════════════════════════════════╗
║                                        ║
║   🚀 Server is running!                ║
║                                        ║
║   Environment: ${config.env.padEnd(21)} ║
║   Port: ${String(config.port).padEnd(28)} ║
║   URL: http://localhost:${config.port}      ║
║                                        ║
╚════════════════════════════════════════╝
      `);
    });

    // ✅ 3. Setup graceful shutdown
    setupGracefulShutdown();
  } catch (error) {
    logger.fatal({ error }, "❌ Application bootstrap failed");
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress");
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, "📥 Received shutdown signal");

  // ✅ Set shutdown timeout
  const shutdownTimeout = setTimeout(() => {
    logger.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 30000);

  try {
    // ✅ 1. Stop accepting new connections
    if (server) {
      logger.info("🔌 Closing HTTP server...");
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error({ error: err }, "Error closing HTTP server");
            reject(err);
          } else {
            logger.info("✅ HTTP server closed");
            resolve();
          }
        });
      });
    }

    // ✅ 2. Close database connections
    logger.info("📦 Closing database connections...");
    await disconnectDatabase();

    // ✅ 3. Clear shutdown timeout
    clearTimeout(shutdownTimeout);

    logger.info("✅ Application shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "❌ Error during shutdown");
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  // ✅ Handle SIGTERM (Kubernetes, Docker)
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // ✅ Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // ✅ Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "💥 Uncaught exception");
    gracefulShutdown("uncaughtException");
  });

  // ✅ Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.fatal(
      {
        reason,
        promise,
      },
      "💥 Unhandled promise rejection"
    );
    gracefulShutdown("unhandledRejection");
  });

  // ✅ Handle warnings (in development)
  if (config.env === "development") {
    process.on("warning", (warning) => {
      logger.warn(
        {
          name: warning.name,
          message: warning.message,
          stack: warning.stack,
        },
        "⚠️ Node.js warning"
      );
    });
  }
}

// ✅ Start application
bootstrap();
