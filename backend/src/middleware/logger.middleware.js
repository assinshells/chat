// backend/src/middleware/logger.middleware.js

import { logger } from "../lib/logger.js";

const SKIP_PATHS = ["/health", "/metrics"];

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

export const requestLogger = (req, res, next) => {
  if (SKIP_PATHS.some((path) => req.path.startsWith(path))) {
    return next();
  }

  const start = Date.now();

  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    headers: sanitizeHeaders(req.headers),
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
