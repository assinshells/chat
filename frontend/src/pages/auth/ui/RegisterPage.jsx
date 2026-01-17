// frontend/src/pages/auth/ui/RegisterPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthContext";
import { api } from "@shared/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    nickname: "",
    password: "",
    confirmPassword: "",
    email: "",
    captchaText: "",
  });
  const [captcha, setCaptcha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const response = await api.get("/api/auth/captcha");
      setCaptcha(response.data.data);
    } catch (err) {
      setError("Failed to load captcha");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      await register(
        formData.nickname,
        formData.password,
        formData.email || undefined,
        captcha.captchaId,
        formData.captchaText,
      );
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
      loadCaptcha();
      setFormData({ ...formData, captchaText: "" });
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
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                <i className="bi bi-person-plus me-2"></i>
                Register
              </h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="nickname" className="form-label">
                    Nickname <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    pattern="[a-zA-Z0-9_-]{3,30}"
                    title="3-30 characters: letters, numbers, hyphens, underscores"
                    required
                    disabled={loading}
                  />
                  <small className="text-muted">
                    3-30 characters: letters, numbers, hyphens, underscores
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-muted">(optional)</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    CAPTCHA <span className="text-danger">*</span>
                  </label>
                  {captcha && (
                    <div className="alert alert-info mb-2">
                      <strong>Enter this code:</strong>{" "}
                      <code className="fs-5">
                        {captcha.captchaText || "Loading..."}
                      </code>
                    </div>
                  )}
                  <input
                    type="text"
                    className="form-control"
                    name="captchaText"
                    value={formData.captchaText}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter CAPTCHA"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </form>

              <hr />

              <div className="text-center">
                <p className="mb-0">
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
