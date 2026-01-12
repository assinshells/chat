// frontend/src/shared/api/services/health.service.js

import { apiClient, API_ENDPOINTS } from "../index.js";

/**
 * Health check service
 */
export const healthService = {
  /**
   * Basic health check
   */
  check: async () => {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH);
    return response.data;
  },

  /**
   * Readiness check
   */
  ready: async () => {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH_READY);
    return response.data;
  },

  /**
   * Liveness check
   */
  live: async () => {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH_LIVE);
    return response.data;
  },

  /**
   * API health check
   */
  apiCheck: async () => {
    const response = await apiClient.get(API_ENDPOINTS.API_HEALTH);
    return response.data;
  },
};
