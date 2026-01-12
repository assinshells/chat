// backend/src/app/server.js

import http from "http";
import { app } from "./app.js";
import { logger } from "../lib/logger.js";

/**
 * Create HTTP server
 */
export function createServer() {
  const server = http.createServer(app);

  server.on("error", (error) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    switch (error.code) {
      case "EACCES":
        logger.error("Port requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        logger.error("Port is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  return server;
}
