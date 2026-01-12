// backend/src/shared/lib/logger.js

import pino from "pino";
import { config } from "../config/index.js";

/**
 * Create Pino logger instance
 */
const pinoConfig = {
  level: config.logger.level,

  // Pretty print in development
  ...(config.logger.prettyPrint && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),

  // Base configuration
  base: {
    env: config.env,
  },

  // Timestamp format
  timestamp: () => `,"time":"${new Date().toISOString()}"`,

  // Serializers for common objects
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        userAgent: req.headers["user-agent"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
};

/**
 * Logger instance
 */
export const logger = pino(pinoConfig);
