// backend/src/services/password.service.js

import crypto from "crypto";
import { User } from "../models/user.model.js";
import {
  ValidationError,
  UnauthorizedError,
} from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";

const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

export const passwordService = {
  /**
   * Request password reset
   */
  async requestReset(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      logger.warn({ email }, "Password reset requested for non-existent email");
      return { message: "If the email exists, a reset link will be sent" };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL);
    await user.save();

    logger.info({ userId: user._id }, "Password reset requested");

    // In development, log the token instead of sending email
    if (process.env.NODE_ENV === "development") {
      logger.info(
        {
          userId: user._id,
          email: user.email,
          resetToken,
          resetUrl: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/reset-password?token=${resetToken}`,
        },
        "Password reset token (dev mode)"
      );
    } else {
      // TODO: Send email in production
      // await emailService.sendPasswordReset(user.email, resetToken);
    }

    return { message: "If the email exists, a reset link will be sent" };
  },

  /**
   * Verify reset token
   */
  async verifyResetToken(token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    return user;
  },

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const user = await this.verifyResetToken(token);

    // Validate password strength
    if (newPassword.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    logger.info({ userId: user._id }, "Password reset completed");

    return { message: "Password reset successful" };
  },

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    user.password = newPassword;
    await user.save();

    logger.info({ userId: user._id }, "Password changed");

    return { message: "Password changed successfully" };
  },
};
