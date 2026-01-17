// frontend/src/pages/admin/ui/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { useAuth } from "@app/providers/AuthContext";
import { api } from "@shared/api";

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, usersRes, healthRes] = await Promise.all([
        api.get("/api/admin/dashboard"),
        api.get("/api/admin/users?limit=20"),
        api.get("/api/admin/health"),
      ]);

      setDashboard(dashboardRes.data.data);
      setUsers(usersRes.data.data.users);
      setHealth(healthRes.data.data);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      loadData();
    } catch (error) {
      alert("Failed to update user status");
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === "user" ? "superadmin" : "user";
    if (!confirm(`Change role to ${newRole}?`)) return;

    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      loadData();
    } catch (error) {
      alert("Failed to update user role");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container-fluid">
          <span className="navbar-brand">
            <i className="bi bi-shield-check me-2"></i>
            Admin Dashboard
          </span>
          <div className="d-flex text-white">
            <span className="me-3">@{user?.nickname}</span>
            <a href="/chat" className="btn btn-sm btn-outline-light me-2">
              <i className="bi bi-chat-dots me-1"></i>
              Chat
            </a>
            <button className="btn btn-sm btn-outline-light" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "health" ? "active" : ""}`}
              onClick={() => setActiveTab("health")}
            >
              System Health
            </button>
          </li>
        </ul>

        {activeTab === "overview" && dashboard && (
          <div className="row">
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h2>{dashboard.overview.totalUsers}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Active Users</h5>
                  <h2 className="text-success">
                    {dashboard.overview.activeUsers}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Messages</h5>
                  <h2>{dashboard.overview.totalMessages}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Active Sessions</h5>
                  <h2>{dashboard.overview.activeSessions}</h2>
                </div>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Recent Users</h5>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nickname</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentUsers.map((u) => (
                          <tr key={u.id}>
                            <td>{u.nickname}</td>
                            <td>{u.email || "-"}</td>
                            <td>
                              <span
                                className={`badge ${u.role === "superadmin" ? "bg-danger" : "bg-primary"}`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}
                              >
                                {u.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">User Management</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nickname</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nickname}</td>
                        <td>{u.email || "-"}</td>
                        <td>
                          <span
                            className={`badge ${u.role === "superadmin" ? "bg-danger" : "bg-primary"}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleChangeRole(u.id, u.role)}
                          >
                            Change Role
                          </button>
                          <button
                            className={`btn btn-sm ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() =>
                              handleToggleUserStatus(u.id, u.isActive)
                            }
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "health" && health && (
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Server Status</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Status</span>
                      <span className="badge bg-success">{health.status}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Uptime</span>
                      <strong>{Math.floor(health.uptime / 60)} minutes</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Environment</span>
                      <strong>{health.environment}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Node Version</span>
                      <strong>{health.node}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Memory Usage</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Used</span>
                      <strong>{health.memory.used} MB</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Total</span>
                      <strong>{health.memory.total} MB</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Database</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Status</span>
                      <span
                        className={`badge ${health.database.connected ? "bg-success" : "bg-danger"}`}
                      >
                        {health.database.connected
                          ? "Connected"
                          : "Disconnected"}
                      </span>
                    </li>
                    {health.database.collections && (
                      <>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Users</span>
                          <strong>{health.database.collections.users}</strong>
                        </li>
                        <li className="list-group-item d-flex justify-content-between">
                          <span>Messages</span>
                          <strong>
                            {health.database.collections.messages}
                          </strong>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
