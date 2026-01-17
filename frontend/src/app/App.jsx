// frontend/src/app/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthContext";
import { ErrorBoundary } from "./providers/ErrorBoundary";
import { ProtectedRoute } from "./providers/ProtectedRoute";

import { LoginPage } from "@pages/auth/ui/LoginPage";
import { RegisterPage } from "@pages/auth/ui/RegisterPage";
import { ForgotPasswordPage } from "@pages/auth/ui/ForgotPasswordPage";
import { ResetPasswordPage } from "@pages/auth/ui/ResetPasswordPage";
import { ChatPage } from "@pages/chat/ui/ChatPage";
import { AdminDashboard } from "@pages/admin/ui/AdminDashboard";
import { HealthCheck } from "@pages/health-check";

import "./styles/App.css";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/health" element={<HealthCheck />} />

            {/* Protected routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="superadmin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/chat" replace />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="container mt-5">
                  <div className="alert alert-warning">
                    <h4>Page Not Found</h4>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/chat" className="btn btn-primary">
                      Go to Chat
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
