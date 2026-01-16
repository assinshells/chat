// backend/src/index.js

import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.config.js";
import { createServer } from "./app/server.js";
import { setupSocketIO } from "./sockets/chat.socket.js";
import { User } from "./models/user.model.js";

let server = null;
let io = null;
let isShuttingDown = false;

async function bootstrap() {
  try {
    logger.info("🚀 Starting application...");

    logger.info("📦 Connecting to database...");
    await connectDatabase();

    logger.info("👤 Checking superadmin...");
    const superadmin = await User.createFirstSuperadmin();
    if (superadmin) {
      logger.info(
        { nickname: superadmin.nickname },
        "✅ First superadmin created"
      );
    }

    logger.info("🌐 Starting HTTP server...");
    server = createServer();

    logger.info("🔌 Setting up Socket.IO...");
    io = setupSocketIO(server);

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

      console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Server is running!                   ║
║                                           ║
║   Environment: ${config.env.padEnd(21)}   ║
║   Port: ${String(config.port).padEnd(28)} ║
║   URL: http://localhost:${config.port}    ║
║   Socket.IO: ✅ Ready                     ║
║                                           ║
╚═══════════════════════════════════════════╝
      `);
    });

    setupGracefulShutdown();
  } catch (error) {
    logger.fatal({ error }, "❌ Application bootstrap failed");
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn("Shutdown already in progress");
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, "📥 Received shutdown signal");

  const shutdownTimeout = setTimeout(() => {
    logger.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 30000);

  try {
    if (io) {
      logger.info("🔌 Closing Socket.IO connections...");
      io.close();
    }

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

    logger.info("📦 Closing database connections...");
    await disconnectDatabase();

    clearTimeout(shutdownTimeout);

    logger.info("✅ Application shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "❌ Error during shutdown");
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

function setupGracefulShutdown() {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "💥 Uncaught exception");
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.fatal({ reason, promise }, "💥 Unhandled promise rejection");
    gracefulShutdown("unhandledRejection");
  });

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

bootstrap();
