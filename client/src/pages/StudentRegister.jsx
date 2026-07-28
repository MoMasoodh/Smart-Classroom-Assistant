import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import api from "../services/api";
import "./TeacherRegister.css";

function StudentRegister() {

  const navigate = useNavigate();

  const [registerNumber, setRegisterNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
        registerNumber,
        fullName,
        department,
        year,
        password,
      });

      setToast("Registration Successful");

      navigate("/student-login", {
        replace: true,
      });

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "Unable to register."
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className="auth-page">

      <Navbar />

      <div className="auth-shell">

        <section className="auth-card register-card">

          <span className="eyebrow">
            Student Access
          </span>

          <h1>Create Student Account</h1>

          <p className="auth-copy">
            Register once and join classroom sessions.
          </p>

          <form
            className="auth-form"
            onSubmit={registerStudent}
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
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
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

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
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
                ? "Registering..."
                : "Register"}
            </button>

          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/student-login">
              Login
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

export default StudentRegister;