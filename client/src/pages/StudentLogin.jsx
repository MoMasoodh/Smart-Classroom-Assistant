import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import { saveStudent, clearActiveSession, clearStudentProfile } from "../services/storage";
import { GraduationCap, LogIn, Eye, EyeOff } from "lucide-react";
import "./TeacherLogin.css";

function StudentLogin() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    if (!registerNumber || !password) {
      setError("Both Register Number and Password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/student-auth/login", {
        registerNumber,
        password,
      });

      saveStudent(response.data);
      clearActiveSession();
      clearStudentProfile();

      setToast("Login Successful");
      addToast(`Welcome back, ${response.data.student?.fullName || "Student"}!`, "success");
      navigate("/student-dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to login. Please check register number.";
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
        <section className="login-card auth-card hero-card" style={{ maxWidth: "460px", margin: "2rem auto" }}>
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
            <GraduationCap size={24} />
          </div>

          <span className="eyebrow">Student Portal</span>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.25rem" }}>Student Login</h1>
          <p className="login-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1.25rem" }}>
            Sign in to join live classroom sessions and attend quizzes.
          </p>

          <form className="auth-form" onSubmit={handleLogin} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Register / Student ID Number</label>
              <input
                type="text"
                placeholder="e.g. 2024CS101"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
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

            <button className="primary-button" disabled={loading} style={{ width: "100%", padding: "0.85rem" }}>
              {loading ? (
                "Logging in..."
              ) : (
                <>
                  <LogIn size={18} /> Student Login
                </>
              )}
            </button>
          </form>

          <p className="auth-footer" style={{ textAlign: "center", marginTop: "1.25rem" }}>
            Don't have a student account? <Link to="/student-register">Register Account</Link>
          </p>
        </section>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default StudentLogin;