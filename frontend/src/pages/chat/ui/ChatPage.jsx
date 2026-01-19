// frontend/src/pages/chat/ui/ChatPage.jsx

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAuth } from "@app/providers/AuthContext";
import { useSocket } from "@shared/hooks/useSocket";

const MessageItem = memo(({ msg, currentUserId, onDelete }) => {
  const isOwn = msg.user === currentUserId;

  return (
    <div className={`mb-2 ${isOwn ? "text-end" : ""}`}>
      <div
        className={`d-inline-block p-2 rounded ${
          isOwn ? "bg-primary text-white" : "bg-white border"
        }`}
        style={{ maxWidth: "70%" }}
      >
        <small className="d-block fw-bold">
          {msg.nickname}
          {isOwn && (
            <button
              className="btn btn-sm btn-link text-white p-0 ms-2"
              onClick={() => onDelete(msg.id)}
              aria-label="Delete message"
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
  );
});

MessageItem.displayName = "MessageItem";

export function ChatPage() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { isConnected, emit, on, off } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleHistory = (data) => {
      setMessages(data.messages);
    };

    const handleMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    };

    const handleUserJoined = (data) => {
      console.log(`${data.nickname} joined`);
    };

    const handleUserLeft = (data) => {
      console.log(`${data.nickname} left`);
    };

    const handleUserTyping = (data) => {
      setTyping(data.nickname);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
    };

    const handleError = (data) => {
      alert(data.message);
    };

    on("chat:history", handleHistory);
    on("chat:message", handleMessage);
    on("chat:message-deleted", handleMessageDeleted);
    on("chat:user-joined", handleUserJoined);
    on("chat:user-left", handleUserLeft);
    on("chat:user-typing", handleUserTyping);
    on("chat:error", handleError);

    return () => {
      off("chat:history", handleHistory);
      off("chat:message", handleMessage);
      off("chat:message-deleted", handleMessageDeleted);
      off("chat:user-joined", handleUserJoined);
      off("chat:user-left", handleUserLeft);
      off("chat:user-typing", handleUserTyping);
      off("chat:error", handleError);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isConnected, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = inputMessage.trim();
      if (!trimmed) return;

      emit("chat:message", { content: trimmed });
      setInputMessage("");
    },
    [inputMessage, emit],
  );

  const handleTyping = useCallback(() => {
    emit("chat:typing");
  }, [emit]);

  const handleDeleteMessage = useCallback(
    (messageId) => {
      if (confirm("Delete this message?")) {
        emit("chat:delete-message", { messageId });
      }
    },
    [emit],
  );

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
          <MessageItem
            key={msg.id}
            msg={msg}
            currentUserId={user?.id}
            onDelete={handleDeleteMessage}
          />
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
