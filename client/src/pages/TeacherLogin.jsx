import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import { UserCheck, Eye, EyeOff, LogIn } from "lucide-react";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      addToast(`Welcome back, ${response.data.teacher?.fullName || "Teacher"}!`, "success");
      navigate(location.state?.from?.pathname || "/teacher-dashboard", { replace: true });
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to login. Check credentials.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-shell fade-in">
        <div className="login-card auth-card hero-card">
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <UserCheck size={24} />
          </div>

          <span className="eyebrow">Teacher Portal</span>
          <h1>Teacher Login</h1>
          <p className="login-subtitle">
            Sign in to manage classroom sessions, doubts & quizzes.
          </p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-button" disabled={loading} style={{ width: "100%", padding: "0.85rem" }}>
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  <LogIn size={18} /> Login to Dashboard
                </>
              )}
            </button>
          </form>

          <p className="auth-footer" style={{ textAlign: "center", marginTop: "1.25rem" }}>
            Don't have a teacher account? <Link to="/teacher-register">Create Account</Link>
          </p>
        </div>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default TeacherLogin;