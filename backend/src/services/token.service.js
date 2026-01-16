// backend/src/services/token.service.js

import jwt from "jsonwebtoken";
import { RefreshToken } from "../models/refreshToken.model.js";
import { jwtConfig } from "../config/jwt.config.js";
import { UnauthorizedError } from "../middleware/error.middleware.js";

export const tokenService = {
  /**
   * Generate access token
   */
  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role }, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiresIn,
    });
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.access.secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token expired");
      }
      throw new UnauthorizedError("Invalid access token");
    }
  },

  /**
   * Generate refresh token and save to DB
   */
  async generateRefreshToken(userId, ip, userAgent) {
    const token = RefreshToken.generateToken();
    const expiresAt = new Date(Date.now() + jwtConfig.refresh.expiresIn);

    await RefreshToken.create({
      token,
      user: userId,
      expiresAt,
      createdByIp: ip,
      userAgent,
    });

    return token;
  },

  /**
   * Verify and rotate refresh token
   */
  async rotateRefreshToken(token, ip, userAgent) {
    const refreshToken = await RefreshToken.findOne({ token }).populate("user");

    if (!refreshToken) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (!refreshToken.isActive()) {
      // Token reuse detected - revoke all tokens for this user
      await RefreshToken.updateMany(
        { user: refreshToken.user._id },
        { revoked: true, revokedAt: new Date() }
      );
      throw new UnauthorizedError(
        "Token reuse detected. All sessions revoked."
      );
    }

    // Generate new refresh token
    const newToken = await this.generateRefreshToken(
      refreshToken.user._id,
      ip,
      userAgent
    );

    // Revoke old token
    refreshToken.revoked = true;
    refreshToken.revokedAt = new Date();
    refreshToken.replacedBy = newToken;
    await refreshToken.save();

    return {
      user: refreshToken.user,
      refreshToken: newToken,
    };
  },

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken || !refreshToken.isActive()) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    refreshToken.revoked = true;
    refreshToken.revokedAt = new Date();
    await refreshToken.save();
  },

  /**
   * Revoke all user tokens (logout from all devices)
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );
  },
};
