// frontend/src/app/providers/AuthContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api } from "@shared/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCheckingAuth = useRef(false);

  const checkAuth = useCallback(async () => {
    if (isCheckingAuth.current) return;

    isCheckingAuth.current = true;

    try {
      const response = await api.get("/api/auth/me");
      setUser(response.data.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const login = useCallback(async (nickname, password) => {
    const response = await api.post("/api/auth/login", { nickname, password });
    setUser(response.data.data.user);
    return response.data;
  }, []);

  const register = useCallback(
    async (nickname, password, email, captchaId, captchaText) => {
      const response = await api.post("/api/auth/register", {
        nickname,
        password,
        email,
        captchaId,
        captchaText,
      });
      setUser(response.data.data.user);
      return response.data;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post("/api/auth/refresh");
      setUser(response.data.data.user);
      return response.data.data.accessToken;
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    isSuperadmin: user?.role === "superadmin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
