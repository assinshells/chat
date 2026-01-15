// frontend/src/pages/health-check/ui/HealthCheck.jsx

import { useState, useEffect } from "react";
import { healthService } from "@shared/api";
import { retry } from "@shared/lib/retry";
import { HealthStatus } from "@widgets/health-status";

export function HealthCheck() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await retry(() => healthService.check(), {
        retries: 3,
        delay: 1000,
        onRetry: (attempt, waitTime) => {
          console.log(`Retry attempt ${attempt}, waiting ${waitTime}ms`);
        },
      });

      setHealthStatus(status);
    } catch (err) {
      setError(err.message || "Failed to connect to server");
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <HealthStatus
            status={healthStatus}
            loading={loading}
            error={error}
            onRefresh={checkHealth}
          />
        </div>
      </div>
    </div>
  );
}
