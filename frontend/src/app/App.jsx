// frontend/src/app/App.jsx

import { ErrorBoundary } from "./providers/ErrorBoundary";
import { HealthCheck } from "@pages/health-check";
import "./styles/App.css";

export function App() {
  return (
    <ErrorBoundary>
      <HealthCheck />
    </ErrorBoundary>
  );
}
