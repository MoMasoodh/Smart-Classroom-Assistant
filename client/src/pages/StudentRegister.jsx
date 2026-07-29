import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import "./TeacherRegister.css";

function StudentRegister() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [registerNumber, setRegisterNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function registerStudent(e) {
    e.preventDefault();

    if (
      !registerNumber.trim() ||
      !fullName.trim() ||
      !department.trim() ||
      !year ||
      !password ||
      !confirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/student-auth/register", {
        registerNumber: registerNumber.trim().toUpperCase(),
        fullName: fullName.trim(),
        department: department.trim(),
        year,
        password,
      });

      setToast("Registration Successful");
      addToast("Student account created successfully! Please login.", "success");
      navigate("/student-login", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to register student account.";
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
        <section className="auth-card register-card hero-card" style={{ maxWidth: "500px", margin: "2rem auto" }}>
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
            <UserPlus size={24} />
          </div>

          <span className="eyebrow">Student Registration</span>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.25rem" }}>Create Student Account</h1>
          <p className="auth-copy" style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1.25rem" }}>
            Register once to access live classrooms, doubts, quizzes, and class leaderboards.
          </p>

          <form className="auth-form" onSubmit={registerStudent} style={{ display: "grid", gap: "1rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Register Number / Student ID</label>
              <input
                type="text"
                placeholder="e.g. 2024CS101"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Year of Study</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="e.g. 3"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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

            <div className="form-group" style={{ margin: 0 }}>
              <label>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button className="primary-button" disabled={loading} style={{ width: "100%", padding: "0.85rem" }}>
              {loading ? "Registering..." : "Create Student Account"}
            </button>
          </form>

          <p className="auth-footer" style={{ textAlign: "center", marginTop: "1.25rem" }}>
            Already registered? <Link to="/student-login">Log In</Link>
          </p>
        </section>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default StudentRegister;