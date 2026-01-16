// backend/src/models/refreshToken.model.js

import mongoose from "mongoose";
import crypto from "crypto";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    replacedBy: {
      type: String,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    createdByIp: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
refreshTokenSchema.index({ user: 1, revoked: 1 });
refreshTokenSchema.index({ token: 1 });

// Generate token
refreshTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(64).toString("hex");
};

// Check if token is active
refreshTokenSchema.methods.isActive = function () {
  return !this.revoked && this.expiresAt > Date.now();
};

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
