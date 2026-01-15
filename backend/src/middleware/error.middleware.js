// backend/src/middleware/error.middleware.js

import { logger } from "../lib/logger.js";
import { ERROR_CODES, HTTP_STATUS } from "../constants/errorCodes.js";

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code = ERROR_CODES.INTERNAL_ERROR,
    errors = null
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      code: this.code,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
    };
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors = null) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

/**
 * Database Error (500)
 */
export class DatabaseError extends AppError {
  constructor(message = "Database error") {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.DATABASE_ERROR
    );
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // ✅ Normalize error
  let error = err instanceof AppError ? err : new AppError(err.message);

  // ✅ Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    error = new ValidationError("Validation failed", errors);
  }

  // ✅ Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ValidationError(`${field} already exists`, [
      { field, message: "Duplicate value" },
    ]);
  }

  // ✅ Handle Mongoose cast errors
  if (err.name === "CastError") {
    error = new ValidationError(`Invalid ${err.path}: ${err.value}`);
  }

  // ✅ Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new UnauthorizedError("Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    error = new UnauthorizedError("Token expired");
  }

  // ✅ Log error (with sanitization)
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
  };

  // ✅ Log stack only for server errors
  if (error.statusCode >= 500) {
    logData.error.stack = error.stack;
    logger.error(logData, "Server error");
  } else {
    logger.warn(logData, "Client error");
  }

  // ✅ Send response
  const response = error.toJSON();

  // ✅ Include stack trace only in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 404 handler (must be after all routes)
 */
export const notFoundHandler = (req, res) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`
  );

  logger.warn(
    {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
    "Route not found"
  );

  res.status(error.statusCode).json(error.toJSON());
};
