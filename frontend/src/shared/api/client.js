// frontend/src/shared/api/client.js

import axios from "axios";

/**
 * API Configuration
 */
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

/**
 * Create axios instance
 */
export const apiClient = axios.create(API_CONFIG);

/**
 * Request ID for tracing
 */
let requestId = 0;
const generateRequestId = () => `req_${Date.now()}_${++requestId}`;

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    // ✅ Add request ID for tracing
    config.headers["X-Request-ID"] = generateRequestId();

    // ✅ Add timestamp
    config.metadata = { startTime: Date.now() };

    // ✅ Log in development
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", {
        id: config.headers["X-Request-ID"],
        method: config.method.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request setup error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => {
    // ✅ Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;

    // ✅ Log in development
    if (import.meta.env.DEV) {
      console.log("✅ API Response:", {
        id: response.config.headers["X-Request-ID"],
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // ✅ Calculate request duration (if available)
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : null;

    // ✅ Structured error logging
    const errorData = {
      id: error.config?.headers?.["X-Request-ID"],
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      duration: duration ? `${duration}ms` : null,
    };

    console.error("❌ API Error:", errorData);

    // ✅ Handle specific status codes
    switch (error.response?.status) {
      case 401:
        // Unauthorized - redirect to login
        console.warn("Unauthorized - redirecting to login");
        window.location.href = "/login";
        break;

      case 403:
        // Forbidden
        console.warn("Access forbidden");
        break;

      case 404:
        // Not found
        console.warn("Resource not found");
        break;

      case 429:
        // Rate limit exceeded
        console.warn("Rate limit exceeded - please slow down");
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        console.error("Server error - please try again later");
        break;
      default:
        break;
    }

    // ✅ Return structured error
    return Promise.reject({
      message:
        error.response?.data?.message || error.message || "An error occurred",
      status: error.response?.status,
      code: error.response?.data?.code,
      errors: error.response?.data?.errors,
      originalError: error,
    });
  }
);
/**

API client with typed methods
*/
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};
