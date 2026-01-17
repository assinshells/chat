// frontend/src/pages/auth/ui/ResetPasswordPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@shared/api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/password/reset", {
        token,
        password: formData.password,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Password reset successful! Please login." },
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                <i className="bi bi-shield-lock me-2"></i>
                Reset Password
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
                  <strong>Password reset successful!</strong>
                  <p className="mb-0 mt-2">Redirecting to login...</p>
                </div>
              )}

              {!token ? (
                <div className="text-center">
                  <p className="text-danger">Invalid or missing reset token</p>
                  <Link to="/forgot-password" className="btn btn-primary">
                    Request New Link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      required
                      disabled={loading || success}
                      autoComplete="new-password"
                    />
                    <small className="text-muted">Minimum 8 characters</small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading || success}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="alert alert-info small">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Password requirements:</strong>
                      <ul className="mb-0 mt-1">
                        <li>At least 8 characters long</li>
                        <li>Use a mix of letters, numbers, and symbols</li>
                        <li>Avoid common words or patterns</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              )}

              <hr />

              <div className="text-center">
                <Link to="/login">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
