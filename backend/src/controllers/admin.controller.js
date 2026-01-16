// backend/src/controllers/admin.controller.js

import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../utils/helpers.js";
import { isConnected } from "../config/database.config.js";

export const adminController = {
  /**
   * GET /api/admin/dashboard - Get dashboard statistics
   */
  getDashboard: asyncHandler(async (req, res) => {
    const [
      totalUsers,
      activeUsers,
      totalMessages,
      activeSessions,
      recentUsers,
      chatStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Message.countDocuments({ isDeleted: false }),
      RefreshToken.countDocuments({
        revoked: false,
        expiresAt: { $gt: new Date() },
      }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("nickname email role isActive createdAt lastLoginAt"),
      chatService.getChatStats(),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalMessages,
          activeSessions,
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })),
        chatStats,
      },
    });
  }),

  /**
   * GET /api/admin/users - Get all users
   */
  getUsers: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "", role, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { nickname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("nickname email role isActive createdAt lastLoginAt"),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user._id,
          nickname: user.nickname,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }),

  /**
   * PATCH /api/admin/users/:id/role - Update user role
   */
  updateUserRole: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select("nickname email role isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      data: user,
    });
  }),

  /**
   * PATCH /api/admin/users/:id/status - Update user status
   */
  updateUserStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select("nickname email role isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User status updated",
      data: user,
    });
  }),

  /**
   * GET /api/admin/health - Extended health check
   */
  getHealthInfo: asyncHandler(async (req, res) => {
    const dbConnected = isConnected();

    const health = {
      status: dbConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      node: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
      database: {
        connected: dbConnected,
      },
    };

    if (dbConnected) {
      const [userCount, messageCount] = await Promise.all([
        User.countDocuments(),
        Message.countDocuments(),
      ]);

      health.database.collections = {
        users: userCount,
        messages: messageCount,
      };
    }

    res.json({
      success: true,
      data: health,
    });
  }),
};
