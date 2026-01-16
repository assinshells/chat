// backend/src/middleware/auth.middleware.js

import { tokenService } from "../services/token.service.js";
import { User } from "../models/user.model.js";
import { UnauthorizedError, ForbiddenError } from "./error.middleware.js";
import { COOKIE_NAMES } from "../config/jwt.config.js";

/**
 * Authenticate user via JWT (cookie or header)
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedError("Access token required");
    }

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);

    // Get user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is deactivated");
    }

    // Attach user to request
    req.user = {
      id: user._id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return next(error);
    }
    next(new UnauthorizedError("Invalid access token"));
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = {
          id: user._id,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }

  next();
};
