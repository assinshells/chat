// frontend/src/shared/api/client.js

import axios from "axios";

/**
 * API base URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Axios instance with default configuration
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Send httpOnly cookies automatically
});

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    // ✅ No manual token handling - cookies are sent automatically

    // Log request in development
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", {
        method: config.method.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Handle errors globally
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };

    console.error("❌ API Error:", errorData);

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      // ✅ No need to clear localStorage
      window.location.href = "/login";
    }

    // Return structured error
    return Promise.reject({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    });
  }
);
