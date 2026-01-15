// frontend/src/features/health-check/model/useHealthCheck.js

import { useState, useCallback } from "react";
import { healthApi } from "../api/health.api";
import { retry } from "@shared/lib/retry";

export function useHealthCheck() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await retry(
        () => healthApi.check().then((res) => res.data),
        {
          retries: 3,
          delay: 1000,
          onRetry: (attempt, waitTime) => {
            console.log(`Retry attempt ${attempt}, waiting ${waitTime}ms`);
          },
        }
      );

      setStatus(result);
    } catch (err) {
      setError(err.message || "Failed to connect to server");
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, error, checkHealth };
}
