// frontend/src/widgets/health-status/ui/HealthStatus.jsx

export function HealthStatus({ status, loading, error, onRefresh }) {
  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        <h2 className="mb-0">
          <i className="bi bi-heart-pulse me-2"></i>
          Application Status
        </h2>
      </div>
      <div className="card-body">
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {!loading && !error && status && (
          <SuccessState status={status} onRefresh={onRefresh} />
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-4">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2">Checking server connection...</p>
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="alert alert-danger" role="alert">
      <i className="bi bi-exclamation-triangle me-2"></i>
      <strong>Error:</strong> {error}
    </div>
  );
}

function SuccessState({ status, onRefresh }) {
  return (
    <div>
      <div className="alert alert-success d-flex align-items-center">
        <i className="bi bi-check-circle-fill me-2 fs-4"></i>
        <div>
          <strong>Server Status:</strong> {status.message}
        </div>
      </div>

      <div className="mb-3">
        <h5>Connection Details:</h5>
        <ul className="list-group">
          <li className="list-group-item d-flex justify-content-between">
            <span>
              <i className="bi bi-clock me-2"></i>Timestamp:
            </span>
            <strong>{new Date(status.timestamp).toLocaleString()}</strong>
          </li>
          <li className="list-group-item d-flex justify-content-between">
            <span>
              <i className="bi bi-check-circle me-2"></i>Status:
            </span>
            <span className="badge bg-success">Running</span>
          </li>
        </ul>
      </div>

      <button className="btn btn-primary w-100" onClick={onRefresh}>
        <i className="bi bi-arrow-clockwise me-2"></i>
        Refresh Status
      </button>
    </div>
  );
}
