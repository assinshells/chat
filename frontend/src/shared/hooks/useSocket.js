// frontend/src/shared/hooks/useSocket.js

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { api } from "@shared/api";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let accessToken = null;

    const initSocket = async () => {
      try {
        const response = await api.get("/api/auth/me");
        accessToken = response.data.data.accessToken;

        if (!accessToken) {
          throw new Error("No access token received");
        }

        connectSocket(accessToken);
      } catch (err) {
        console.error("Failed to get access token:", err);
        setError("Failed to authenticate");
      }
    };

    const connectSocket = (token) => {
      if (socketRef.current?.connected) {
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
        setIsConnected(true);
        setError(null);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          reconnectTimeoutRef.current = setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
        setError(err.message);
        setIsConnected(false);
      });

      socketRef.current = socket;
    };

    initSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit:", event);
    }
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
}
