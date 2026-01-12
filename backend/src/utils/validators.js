// backend/src/utils/validators.js

import Joi from "joi";

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

/**
 * Custom Joi validators
 */
export const customValidators = {
  objectId: () =>
    Joi.string().pattern(patterns.mongoId).message("Invalid MongoDB ObjectId"),

  email: () =>
    Joi.string().email().lowercase().trim().message("Invalid email address"),

  password: () =>
    Joi.string()
      .min(8)
      .pattern(patterns.password)
      .message(
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
      ),

  phone: () =>
    Joi.string().pattern(patterns.phone).message("Invalid phone number"),

  url: () => Joi.string().uri().message("Invalid URL"),

  slug: () =>
    Joi.string()
      .pattern(patterns.slug)
      .lowercase()
      .message("Invalid slug format"),

  pagination: () =>
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  return patterns.email.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  return patterns.phone.test(phone);
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return patterns.mongoId.test(id);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
  return patterns.url.test(url);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  return patterns.password.test(password);
};

/**
 * Sanitize string (remove HTML tags)
 */
export const sanitizeString = (str) => {
  return str.replace(/<[^>]*>/g, "").trim();
};

/**
 * Example validation schemas
 */
export const validationSchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid("asc", "desc").default("asc"),
  }),

  // Search
  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),

  // ID parameter
  idParam: Joi.object({
    id: customValidators.objectId().required(),
  }),
};
