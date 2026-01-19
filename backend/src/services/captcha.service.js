// backend/src/services/captcha.service.js

import crypto from "crypto";
import { logger } from "../lib/logger.js";

const CAPTCHA_LENGTH = 6;
const CAPTCHA_TTL = 5 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;

class CaptchaService {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, captcha] of this.store.entries()) {
      if (now > captcha.expiresAt) {
        this.store.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, "Cleaned expired captchas");
    }
  }

  generate() {
    const captchaId = crypto.randomBytes(16).toString("hex");
    const captchaText = this.generateText();
    const expiresAt = Date.now() + CAPTCHA_TTL;

    this.store.set(captchaId, {
      text: captchaText,
      expiresAt,
    });

    if (process.env.NODE_ENV === "development") {
      logger.info({ captchaId, captchaText }, "CAPTCHA generated");
    }

    return {
      captchaId,
      captchaText:
        process.env.NODE_ENV === "development" ? captchaText : undefined,
    };
  }

  validate(captchaId, captchaText) {
    const captcha = this.store.get(captchaId);

    if (!captcha) {
      logger.warn({ captchaId }, "CAPTCHA not found");
      return false;
    }

    if (Date.now() > captcha.expiresAt) {
      this.store.delete(captchaId);
      logger.warn({ captchaId }, "CAPTCHA expired");
      return false;
    }

    this.store.delete(captchaId);

    const isValid = captcha.text.toLowerCase() === captchaText.toLowerCase();

    logger.info({ captchaId, isValid }, "CAPTCHA validation");

    return isValid;
  }

  generateText() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";

    for (let i = 0; i < CAPTCHA_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export const captchaService = new CaptchaService();
