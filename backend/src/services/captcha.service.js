// backend/src/services/captcha.service.js

import crypto from "crypto";
import { logger } from "../lib/logger.js";

const captchaStore = new Map();
const CAPTCHA_LENGTH = 6;
const CAPTCHA_TTL = 5 * 60 * 1000; // 5 minutes

export const captchaService = {
  /**
   * Generate captcha
   */
  generate() {
    const captchaId = crypto.randomBytes(16).toString("hex");
    const captchaText = this._generateCaptchaText();
    const expiresAt = Date.now() + CAPTCHA_TTL;

    captchaStore.set(captchaId, {
      text: captchaText,
      expiresAt,
    });

    // Log in development
    if (process.env.NODE_ENV === "development") {
      logger.info({ captchaId, captchaText }, "CAPTCHA generated");
    }

    // Clean up expired captchas
    this._cleanup();

    return {
      captchaId,
      captchaText:
        process.env.NODE_ENV === "development" ? captchaText : undefined,
    };
  },

  /**
   * Validate captcha
   */
  validate(captchaId, captchaText) {
    const captcha = captchaStore.get(captchaId);

    if (!captcha) {
      logger.warn({ captchaId }, "CAPTCHA not found or expired");
      return false;
    }

    if (Date.now() > captcha.expiresAt) {
      captchaStore.delete(captchaId);
      logger.warn({ captchaId }, "CAPTCHA expired");
      return false;
    }

    captchaStore.delete(captchaId);

    const isValid = captcha.text.toLowerCase() === captchaText.toLowerCase();

    logger.info({ captchaId, isValid }, "CAPTCHA validation");

    return isValid;
  },

  /**
   * Generate random captcha text
   */
  _generateCaptchaText() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < CAPTCHA_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Cleanup expired captchas
   */
  _cleanup() {
    const now = Date.now();
    for (const [id, captcha] of captchaStore.entries()) {
      if (now > captcha.expiresAt) {
        captchaStore.delete(id);
      }
    }
  },
};
