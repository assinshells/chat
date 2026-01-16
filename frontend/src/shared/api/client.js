// frontend/src/shared/api/client.js

import axios from "axios";

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

export const apiClient = axios.create(API_CONFIG);

let requestId = 0;
const generateRequestId = () => `req_${Date.now()}_${++requestId}`;

apiClient.interceptors.request.use(
  (config) => {
    config.headers["X-Request-ID"] = generateRequestId();
    config.metadata = { startTime: Date.now() };

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

apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;

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
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : null;

    const errorData = {
      id: error.config?.headers?.["X-Request-ID"],
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      duration: duration ? `${duration}ms` : null,
    };

    console.error("❌ API Error:", errorData);

    const status = error.response?.status;

    if (status === 401) {
      console.warn("Unauthorized - redirecting to login");
      window.location.href = "/login";
    } else if (status === 403) {
      console.warn("Access forbidden");
    } else if (status === 404) {
      console.warn("Resource not found");
    } else if (status === 429) {
      console.warn("Rate limit exceeded");
    } else if (status >= 500) {
      console.error("Server error - please try again later");
    }

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

export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};
