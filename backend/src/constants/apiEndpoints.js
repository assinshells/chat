// backend/src/constants/apiEndpoints.js

/**
 * API Endpoints Constants
 */
export const API_ENDPOINTS = {
  // Base
  BASE: "/api",

  // Health
  HEALTH: {
    BASE: "/health",
    READY: "/health/ready",
    LIVE: "/health/live",
    INFO: "/health/info",
  },

  // Auth (example)
  AUTH: {
    BASE: "/api/auth",
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    ME: "/api/auth/me",
  },

  // Users (example)
  USERS: {
    BASE: "/api/users",
    BY_ID: (id) => `/api/users/${id}`,
  },
};

/**
 * API Versions
 */
export const API_VERSIONS = {
  V1: "/api/v1",
  V2: "/api/v2",
};
