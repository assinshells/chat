// backend/src/middleware/logger.middleware.js

import { logger } from "../lib/logger.js";

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info({
    req,
    msg: "Incoming request",
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      req,
      res,
      duration,
      msg: "Request completed",
    });
  });

  next();
};

/**
 * Skip logging for specific routes
 */
export const skipLogger =
  (paths = []) =>
  (req, res, next) => {
    if (paths.some((path) => req.path.startsWith(path))) {
      return next();
    }
    return requestLogger(req, res, next);
  };
