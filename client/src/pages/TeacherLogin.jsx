import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import "./TeacherLogin.css";

function TeacherLogin() {

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function handleLogin(e) {

    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      login(response.data);
      setToast("Login Successful");
      navigate(location.state?.from?.pathname || "/teacher-dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to login.");
    } finally {
      setLoading(false);
    }

  }

  return (

    <div className="auth-page">

      <Navbar />

      <div className="auth-shell">

        <div className="login-card auth-card">

          <span className="eyebrow">Teacher access</span>
          <h1>Teacher Login</h1>

          <p className="login-subtitle">
            Smart Classroom Assistant
          </p>

          <form onSubmit={handleLogin} className="auth-form">

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/teacher-register">Register</Link>
          </p>

        </div>

      </div>

      <Toast message={toast} type="success" />

    </div>

  );

}

export default TeacherLogin;