import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import api from "../services/api";
import { saveStudent } from "../services/storage";

import "./TeacherLogin.css";

function StudentLogin() {

  const navigate = useNavigate();

  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function handleLogin(e) {

    e.preventDefault();

    if (!registerNumber || !password) {
      setError("All fields are required.");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const response = await api.post(
        "/student-auth/login",
        {
          registerNumber,
          password,
        }
      );

      saveStudent(response.data);

      setToast("Login Successful");

      navigate("/student-dashboard");

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "Unable to login."
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="auth-page">

      <Navbar />

      <div className="auth-shell">

        <section className="login-card auth-card">

          <span className="eyebrow">
            Student Access
          </span>

          <h1>Student Login</h1>

          <p className="login-subtitle">
            Smart Classroom Assistant
          </p>

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            <input
              type="text"
              placeholder="Register Number"
              value={registerNumber}
              onChange={(e) =>
                setRegisterNumber(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            {error &&
              <p className="error-text">{error}</p>
            }

            <button
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/student-register">
              Register
            </Link>
          </p>

        </section>

      </div>

      <Toast
        message={toast}
        type="success"
      />

    </div>

  );

}

export default StudentLogin;