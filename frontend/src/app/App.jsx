import { useState, useEffect } from "react";
import { healthService } from "./shared/api/services/health.service.js";
import "./App.css";

function App() {
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
      const status = await healthService.check();
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
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-heart-pulse me-2"></i>
                Application Status
              </h2>
            </div>
            <div className="card-body">
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Checking server connection...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {!loading && !error && healthStatus && (
                <div>
                  <div className="alert alert-success d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2 fs-4"></i>
                    <div>
                      <strong>Server Status:</strong> {healthStatus.message}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h5>Connection Details:</h5>
                    <ul className="list-group">
                      <li className="list-group-item d-flex justify-content-between">
                        <span>
                          <i className="bi bi-clock me-2"></i>Timestamp:
                        </span>
                        <strong>
                          {new Date(healthStatus.timestamp).toLocaleString()}
                        </strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between">
                        <span>
                          <i className="bi bi-check-circle me-2"></i>Status:
                        </span>
                        <span className="badge bg-success">Running</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    className="btn btn-primary w-100"
                    onClick={checkHealth}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Status
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-muted">
            <p>
              <i className="bi bi-info-circle me-2"></i>
              This is a demo application showcasing backend-frontend integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
