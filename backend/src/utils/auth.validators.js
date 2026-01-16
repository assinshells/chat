// backend/src/utils/auth.validators.js

import Joi from "joi";

export const authValidators = {
  register: Joi.object({
    nickname: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        "string.pattern.base":
          "Nickname can only contain letters, numbers, hyphens and underscores",
        "string.min": "Nickname must be at least 3 characters",
        "string.max": "Nickname must not exceed 30 characters",
      }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters",
    }),
    email: Joi.string().email().optional().allow("", null),
    captchaId: Joi.string().required(),
    captchaText: Joi.string().required(),
  }),

  login: Joi.object({
    nickname: Joi.string().required(),
    password: Joi.string().required(),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().optional(),
  }),

  requestPasswordReset: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};
