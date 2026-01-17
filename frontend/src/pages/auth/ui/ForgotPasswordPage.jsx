// frontend/src/pages/auth/ui/ForgotPasswordPage.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@shared/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.post("/api/auth/password/request-reset", {
        email,
      });

      setSuccess(true);
      setEmail("");

      console.log("✅ Password reset requested:", response.data);
    } catch (err) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                <i className="bi bi-key me-2"></i>
                Forgot Password
              </h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>Check your email!</strong>
                  <p className="mb-0 mt-2">
                    If an account exists with this email, you will receive
                    password reset instructions.
                  </p>
                  {import.meta.env.DEV && (
                    <p className="mb-0 mt-2 text-muted small">
                      <strong>Dev mode:</strong> Check your server console for
                      the reset link.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter your email"
                  />
                  <small className="text-muted">
                    We'll send you a password reset link
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <hr />

              <div className="text-center">
                <p className="mb-2">
                  <Link to="/login">
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Login
                  </Link>
                </p>
                <p className="mb-0">
                  Don't have an account?{" "}
                  <Link to="/register">Register here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
