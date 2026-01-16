// frontend/src/pages/health-check/ui/HealthCheck.jsx

import { useEffect } from "react";
import { useHealthCheck } from "@features/health-check";
import { HealthStatus } from "@widgets/health-status";

export function HealthCheck() {
  const { status, loading, error, checkHealth } = useHealthCheck();

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <HealthStatus
            status={status}
            loading={loading}
            error={error}
            onRefresh={checkHealth}
          />
        </div>
      </div>
    </div>
  );
}
