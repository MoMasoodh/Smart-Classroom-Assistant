import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import api from "../services/api";
import "./TeacherRegister.css";

function TeacherRegister() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setError("Enter a valid email address.");
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
      navigate("/teacher-login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-shell">
        <section className="auth-card register-card">
          <span className="eyebrow">Teacher access</span>
          <h1>Create Teacher Account</h1>
          <p className="auth-copy">Register once to manage classrooms, doubts, quizzes, and analytics.</p>

          <form className="auth-form" onSubmit={registerTeacher}>
            <input type="text" placeholder="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />

            {error ? <p className="error-text">{error}</p> : null}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/teacher-login">Login</Link>
          </p>
        </section>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default TeacherRegister;