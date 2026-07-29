import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import "./TeacherRegister.css";

function TeacherRegister() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const registerTeacher = async (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/auth/register", {
        fullName: trimmedName,
        email: trimmedEmail,
        password,
      });

      setToast("Registration Successful");
      addToast("Teacher Account registered successfully! Please login.", "success");
      navigate("/teacher-login", { replace: true });
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to register account.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-shell fade-in">
        <section className="auth-card register-card hero-card" style={{ maxWidth: "480px", margin: "2rem auto" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--success-bg)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <UserPlus size={24} />
          </div>

          <span className="eyebrow">Teacher Registration</span>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.25rem" }}>Create Teacher Account</h1>
          <p className="auth-copy" style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1.25rem" }}>
            Register to manage sessions, doubts, quizzes, and analytics.
          </p>

          <form className="auth-form" onSubmit={registerTeacher} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Dr. Alex Morgan"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="alex.morgan@school.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="form-group" style={{ margin: 0 }}>
              <label>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={loading} style={{ width: "100%", padding: "0.85rem" }}>
              {loading ? "Registering Account..." : "Create Teacher Account"}
            </button>
          </form>

          <p className="auth-footer" style={{ textAlign: "center", marginTop: "1.25rem" }}>
            Already registered? <Link to="/teacher-login">Log In</Link>
          </p>
        </section>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default TeacherRegister;