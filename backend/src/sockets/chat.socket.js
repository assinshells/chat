// backend/src/sockets/chat.socket.js

import { Server } from "socket.io";
import { tokenService } from "../services/token.service.js";
import { chatService } from "../services/chat.service.js";
import { User } from "../models/user.model.js";
import { logger } from "../lib/logger.js";
import { corsOptions } from "../config/cors.config.js";

const MESSAGE_RATE_LIMIT = {
  points: 10,
  duration: 60000,
};

const socketRateLimiters = new Map();

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      socket.user = {
        id: user._id,
        nickname: user.nickname,
        role: user.role,
      };

      socketRateLimiters.set(socket.id, {
        points: MESSAGE_RATE_LIMIT.points,
        resetTime: Date.now() + MESSAGE_RATE_LIMIT.duration,
      });

      next();
    } catch (error) {
      logger.error({ error }, "Socket authentication error");
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(
      { userId: socket.user.id, socketId: socket.id },
      "User connected to chat",
    );

    socket.join("chat");

    chatService.getRecentMessages(50).then((messages) => {
      socket.emit("chat:history", { messages });
    });

    socket.to("chat").emit("chat:user-joined", {
      nickname: socket.user.nickname,
      timestamp: new Date(),
    });

    socket.on("chat:message", async (data) => {
      try {
        if (!checkRateLimit(socket.id)) {
          return socket.emit("chat:error", {
            message: "Rate limit exceeded. Please slow down.",
          });
        }

        const { content } = data;

        if (!content || content.trim().length === 0) {
          return socket.emit("chat:error", {
            message: "Message cannot be empty",
          });
        }

        if (content.length > 1000) {
          return socket.emit("chat:error", {
            message: "Message too long (max 1000 characters)",
          });
        }

        const message = await chatService.saveMessage(
          socket.user.id,
          socket.user.nickname,
          content,
        );

        io.to("chat").emit("chat:message", message);

        logger.info(
          { userId: socket.user.id, messageId: message.id },
          "Message sent",
        );
      } catch (error) {
        logger.error(
          { error, userId: socket.user.id },
          "Error sending message",
        );
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    socket.on("chat:delete-message", async (data) => {
      try {
        const { messageId } = data;

        const result = await chatService.deleteMessage(
          messageId,
          socket.user.id,
          socket.user.role,
        );

        io.to("chat").emit("chat:message-deleted", result);

        logger.info({ userId: socket.user.id, messageId }, "Message deleted");
      } catch (error) {
        logger.error(
          { error, userId: socket.user.id },
          "Error deleting message",
        );
        socket.emit("chat:error", {
          message: error.message || "Failed to delete message",
        });
      }
    });

    socket.on("chat:typing", () => {
      socket.to("chat").emit("chat:user-typing", {
        nickname: socket.user.nickname,
      });
    });

    socket.on("disconnect", () => {
      logger.info(
        { userId: socket.user.id, socketId: socket.id },
        "User disconnected from chat",
      );

      socketRateLimiters.delete(socket.id);

      socket.to("chat").emit("chat:user-left", {
        nickname: socket.user.nickname,
        timestamp: new Date(),
      });
    });
  });

  logger.info("Socket.IO initialized");

  return io;
}

function checkRateLimit(socketId) {
  const limiter = socketRateLimiters.get(socketId);

  if (!limiter) return false;

  const now = Date.now();

  if (now > limiter.resetTime) {
    limiter.points = MESSAGE_RATE_LIMIT.points;
    limiter.resetTime = now + MESSAGE_RATE_LIMIT.duration;
  }

  if (limiter.points <= 0) {
    return false;
  }

  limiter.points--;
  return true;
}
