// backend/src/services/auth.service.js

import { User } from "../models/user.model.js";
import { tokenService } from "./token.service.js";
import { captchaService } from "./captcha.service.js";
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";

export const authService = {
  /**
   * Register new user
   */
  async register(
    nickname,
    password,
    email,
    captchaId,
    captchaText,
    ip,
    userAgent
  ) {
    // Validate captcha
    const isCaptchaValid = captchaService.validate(captchaId, captchaText);
    if (!isCaptchaValid) {
      throw new ValidationError("Invalid or expired captcha");
    }

    // Check if nickname exists
    const existingUser = await User.findOne({ nickname });
    if (existingUser) {
      throw new ValidationError("Nickname already exists");
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new ValidationError("Email already exists");
      }
    }

    // Create user
    const user = await User.create({
      nickname,
      password,
      email,
    });

    logger.info({ userId: user._id, nickname }, "User registered");

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id, user.role);
    const refreshToken = await tokenService.generateRefreshToken(
      user._id,
      ip,
      userAgent
    );

    return {
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Login user
   */
  async login(nickname, password, ip, userAgent) {
    // Find user with password field
    const user = await User.findOne({ nickname }).select("+password");

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new ForbiddenError(
        `Account locked. Try again in ${lockMinutes} minutes`
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenError("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      logger.warn({ userId: user._id, nickname }, "Failed login attempt");
      throw new UnauthorizedError("Invalid credentials");
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    logger.info({ userId: user._id, nickname }, "User logged in");

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id, user.role);
    const refreshToken = await tokenService.generateRefreshToken(
      user._id,
      ip,
      userAgent
    );

    return {
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token
   */
  async refresh(refreshToken, ip, userAgent) {
    const { user, refreshToken: newRefreshToken } =
      await tokenService.rotateRefreshToken(refreshToken, ip, userAgent);

    const accessToken = tokenService.generateAccessToken(user._id, user.role);

    logger.info({ userId: user._id }, "Tokens refreshed");

    return {
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Logout user
   */
  async logout(refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
    logger.info("User logged out");
  },

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await tokenService.revokeAllUserTokens(userId);
    logger.info({ userId }, "User logged out from all devices");
  },

  /**
   * Get current user
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return {
      id: user._id,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  },
};
