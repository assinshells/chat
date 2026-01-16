// frontend/src/features/health-check/api/health.api.js

import { apiClient } from "@shared/api";

export const healthApi = {
  check: () => apiClient.get("/health").then((res) => res.data),
  ready: () => apiClient.get("/health/ready").then((res) => res.data),
  live: () => apiClient.get("/health/live").then((res) => res.data),
  apiCheck: () => apiClient.get("/api/health").then((res) => res.data),
};
