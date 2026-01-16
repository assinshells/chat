// backend/src/sockets/chat.socket.js

import { Server } from "socket.io";
import { tokenService } from "../services/token.service.js";
import { chatService } from "../services/chat.service.js";
import { User } from "../models/user.model.js";
import { logger } from "../lib/logger.js";
import { corsOptions } from "../config/cors.config.js";

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
    },
  });

  // Authentication middleware
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

      next();
    } catch (error) {
      logger.error({ error }, "Socket authentication error");
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(
      { userId: socket.user.id, socketId: socket.id },
      "User connected to chat"
    );

    // Join user to main chat room
    socket.join("chat");

    // Send recent messages to new user
    chatService.getRecentMessages(50).then((messages) => {
      socket.emit("chat:history", { messages });
    });

    // Broadcast user joined
    socket.to("chat").emit("chat:user-joined", {
      nickname: socket.user.nickname,
      timestamp: new Date(),
    });

    // Handle new message
    socket.on("chat:message", async (data) => {
      try {
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
          content
        );

        // Broadcast message to all users in chat
        io.to("chat").emit("chat:message", message);

        logger.info(
          { userId: socket.user.id, messageId: message.id },
          "Message sent"
        );
      } catch (error) {
        logger.error(
          { error, userId: socket.user.id },
          "Error sending message"
        );
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });

    // Handle message deletion
    socket.on("chat:delete-message", async (data) => {
      try {
        const { messageId } = data;

        const result = await chatService.deleteMessage(
          messageId,
          socket.user.id,
          socket.user.role
        );

        // Broadcast deletion to all users
        io.to("chat").emit("chat:message-deleted", result);

        logger.info({ userId: socket.user.id, messageId }, "Message deleted");
      } catch (error) {
        logger.error(
          { error, userId: socket.user.id },
          "Error deleting message"
        );
        socket.emit("chat:error", {
          message: error.message || "Failed to delete message",
        });
      }
    });

    // Handle typing indicator
    socket.on("chat:typing", () => {
      socket.to("chat").emit("chat:user-typing", {
        nickname: socket.user.nickname,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      logger.info(
        { userId: socket.user.id, socketId: socket.id },
        "User disconnected from chat"
      );

      socket.to("chat").emit("chat:user-left", {
        nickname: socket.user.nickname,
        timestamp: new Date(),
      });
    });
  });

  logger.info("Socket.IO initialized");

  return io;
}
