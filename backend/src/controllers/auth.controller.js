// backend/src/controllers/auth.controller.js

import { authService } from "../services/auth.service.js";
import { passwordService } from "../services/password.service.js";
import { captchaService } from "../services/captcha.service.js";
import { cookieConfig, COOKIE_NAMES } from "../config/jwt.config.js";
import { asyncHandler } from "../utils/helpers.js";

export const authController = {
  /**
   * GET /api/auth/captcha - Get captcha
   */
  getCaptcha: asyncHandler(async (req, res) => {
    const captcha = captchaService.generate();

    res.json({
      success: true,
      data: captcha,
    });
  }),

  /**
   * POST /api/auth/register - Register new user
   */
  register: asyncHandler(async (req, res) => {
    const { nickname, password, email, captchaId, captchaText } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.register(
      nickname,
      password,
      email,
      captchaId,
      captchaText,
      ip,
      userAgent
    );

    // Set cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, cookieConfig);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  /**
   * POST /api/auth/login - Login user
   */
  login: asyncHandler(async (req, res) => {
    const { nickname, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.login(nickname, password, ip, userAgent);

    // Set cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, cookieConfig);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  /**
   * POST /api/auth/refresh - Refresh access token
   */
  refresh: asyncHandler(async (req, res) => {
    const refreshToken =
      req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body.refreshToken;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.refresh(refreshToken, ip, userAgent);

    // Set new cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, cookieConfig);

    res.json({
      success: true,
      message: "Token refreshed",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  /**
   * POST /api/auth/logout - Logout user
   */
  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);

    res.json({
      success: true,
      message: "Logout successful",
    });
  }),

  /**
   * POST /api/auth/logout-all - Logout from all devices
   */
  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  }),

  /**
   * GET /api/auth/me - Get current user
   */
  getCurrentUser: asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  }),

  /**
   * POST /api/auth/password/request-reset - Request password reset
   */
  requestPasswordReset: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await passwordService.requestReset(email);

    res.json({
      success: true,
      message: result.message,
    });
  }),

  /**
   * POST /api/auth/password/reset - Reset password
   */
  resetPassword: asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await passwordService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message,
    });
  }),

  /**
   * POST /api/auth/password/change - Change password (authenticated)
   */
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await passwordService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.json({
      success: true,
      message: result.message,
    });
  }),
};
