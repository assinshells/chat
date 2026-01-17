// frontend/src/pages/chat/ui/ChatPage.jsx

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@app/providers/AuthContext";
import { useSocket } from "@shared/hooks/useSocket";
import { api } from "@shared/api";

export function ChatPage() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get access token from storage or state
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    api.get("/api/auth/me").then((res) => {
      // Token is in httpOnly cookie, just verify we're authenticated
      setAccessToken("authenticated");
    });
  }, []);

  const { isConnected, emit, on, off } = useSocket(accessToken);

  useEffect(() => {
    if (!isConnected) return;

    on("chat:history", (data) => {
      setMessages(data.messages);
    });

    on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    on("chat:message-deleted", (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    });

    on("chat:user-joined", (data) => {
      console.log(`${data.nickname} joined`);
    });

    on("chat:user-left", (data) => {
      console.log(`${data.nickname} left`);
    });

    on("chat:user-typing", (data) => {
      setTyping(data.nickname);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
    });

    on("chat:error", (data) => {
      alert(data.message);
    });

    return () => {
      off("chat:history");
      off("chat:message");
      off("chat:message-deleted");
      off("chat:user-joined");
      off("chat:user-left");
      off("chat:user-typing");
      off("chat:error");
    };
  }, [isConnected, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    emit("chat:message", { content: inputMessage });
    setInputMessage("");
  };

  const handleTyping = () => {
    emit("chat:typing");
  };

  const handleDeleteMessage = (messageId) => {
    if (confirm("Delete this message?")) {
      emit("chat:delete-message", { messageId });
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <nav className="navbar navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="bi bi-chat-dots me-2"></i>
            Chat Room
          </span>
          <div className="d-flex align-items-center text-white">
            <span className="me-3">
              <i
                className={`bi bi-circle-fill ${isConnected ? "text-success" : "text-danger"} me-2`}
              ></i>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="me-3">@{user?.nickname}</span>
            {user?.role === "superadmin" && (
              <a href="/admin" className="btn btn-sm btn-light me-2">
                <i className="bi bi-shield-check me-1"></i>
                Admin
              </a>
            )}
            <button className="btn btn-sm btn-outline-light" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-grow-1 overflow-auto p-3 bg-light">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 ${msg.user === user?.id ? "text-end" : ""}`}
          >
            <div
              className={`d-inline-block p-2 rounded ${
                msg.user === user?.id
                  ? "bg-primary text-white"
                  : "bg-white border"
              }`}
              style={{ maxWidth: "70%" }}
            >
              <small className="d-block fw-bold">
                {msg.nickname}
                {msg.user === user?.id && (
                  <button
                    className="btn btn-sm btn-link text-white p-0 ms-2"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </small>
              <div>{msg.content}</div>
              <small className="text-muted">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
        {typing && (
          <div className="text-muted">
            <em>{typing} is typing...</em>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-top p-3 bg-white">
        <form onSubmit={handleSendMessage}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleTyping}
              disabled={!isConnected}
              maxLength={1000}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isConnected || !inputMessage.trim()}
            >
              <i className="bi bi-send"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
