// frontend/src/features/health-check/api/health.api.js

import { apiClient } from "@shared/api";

const ENDPOINTS = {
  CHECK: "/health",
  READY: "/health/ready",
  LIVE: "/health/live",
  API: "/api/health",
};

export const healthApi = {
  check: () => apiClient.get(ENDPOINTS.CHECK),
  ready: () => apiClient.get(ENDPOINTS.READY),
  live: () => apiClient.get(ENDPOINTS.LIVE),
  apiCheck: () => apiClient.get(ENDPOINTS.API),
};
