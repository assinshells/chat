// backend/src/models/message.model.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [1000, "Message must not exceed 1000 characters"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ createdAt: -1 });
messageSchema.index({ user: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual for message age
messageSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt;
});

// Static method to get recent messages
messageSchema.statics.getRecent = function (limit = 50) {
  return this.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "nickname role")
    .lean();
};

export const Message = mongoose.model("Message", messageSchema);
