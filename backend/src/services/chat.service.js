// backend/src/services/chat.service.js

import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { logger } from "../lib/logger.js";

export const chatService = {
  /**
   * Save message to DB
   */
  async saveMessage(userId, nickname, content) {
    const message = await Message.create({
      user: userId,
      nickname,
      content: content.trim(),
      type: "text",
    });

    logger.info({ userId, messageId: message._id }, "Message saved");

    return {
      id: message._id,
      user: userId,
      nickname,
      content: message.content,
      createdAt: message.createdAt,
    };
  },

  /**
   * Get recent messages
   */
  async getRecentMessages(limit = 50) {
    const messages = await Message.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return messages.reverse().map((msg) => ({
      id: msg._id,
      user: msg.user,
      nickname: msg.nickname,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  },

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, userId, userRole) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Only message owner or superadmin can delete
    if (
      message.user.toString() !== userId.toString() &&
      userRole !== "superadmin"
    ) {
      throw new Error("Unauthorized to delete this message");
    }

    message.isDeleted = true;
    await message.save();

    logger.info({ messageId, userId }, "Message deleted");

    return { id: messageId };
  },

  /**
   * Get chat statistics
   */
  async getChatStats() {
    const [totalMessages, activeUsers, recentActivity] = await Promise.all([
      Message.countDocuments({ isDeleted: false }),
      User.countDocuments({ isActive: true }),
      Message.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 7 },
      ]),
    ]);

    return {
      totalMessages,
      activeUsers,
      recentActivity: recentActivity.reverse(),
    };
  },
};
