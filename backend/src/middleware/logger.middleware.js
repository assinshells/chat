// backend/src/middleware/logger.middleware.js

import { logger } from "../lib/logger.js";

/**
 * Sanitize headers (remove sensitive data)
 */
const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
  ];

  sensitiveHeaders.forEach((header) => {
    if (sanitized[header]) {
      sanitized[header] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // ✅ Безопасное логирование
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    headers: sanitizeHeaders(req.headers), // ✅ Sanitized
    query: req.query,
    msg: "Incoming request",
  });

  res.on("finish", () => {
    const duration = Date.now() - start;

    const logLevel = res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      msg: "Request completed",
    });
  });

  next();
};

/**
 * Skip logging for specific routes (health checks, metrics)
 */
export const skipLogger = (paths = ["/health", "/metrics"]) => {
  return (req, res, next) => {
    if (paths.some((path) => req.path.startsWith(path))) {
      return next();
    }
    return requestLogger(req, res, next);
  };
};
