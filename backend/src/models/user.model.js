// backend/src/models/user.model.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, "Nickname is required"],
      unique: true,
      trim: true,
      minlength: [3, "Nickname must be at least 3 characters"],
      maxlength: [30, "Nickname must not exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        "Nickname can only contain letters, numbers, hyphens and underscores",
      ],
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "superadmin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ nickname: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  if (this.failedLoginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0, lastLoginAt: Date.now() },
    $unset: { lockUntil: 1 },
  });
};

// Static method to create first superadmin
userSchema.statics.createFirstSuperadmin = async function () {
  const count = await this.countDocuments({ role: "superadmin" });

  if (count === 0) {
    const superadmin = await this.create({
      nickname: "admin",
      password: process.env.SUPERADMIN_PASSWORD || "Admin@12345",
      role: "superadmin",
    });

    return superadmin;
  }

  return null;
};

export const User = mongoose.model("User", userSchema);
