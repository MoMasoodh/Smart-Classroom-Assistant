import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./TeacherLogin.css";

function TeacherLogin() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function login(e) {

    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    navigate("/teacher-dashboard", {
      state: {
        teacherName: email.split("@")[0] || "Teacher",
      },
    });

  }

  return (

    <div className="auth-page">

      <Navbar />

      <div className="login-page">

        <div className="login-card auth-card">

          <span className="eyebrow">Teacher access</span>
          <h1>Teacher Login</h1>

          <p className="login-subtitle">
            Smart Classroom Assistant
          </p>

          <form onSubmit={login} className="auth-form">

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

            <button type="submit" className="primary-button">
              Login
            </button>

          </form>

        </div>

      </div>

    </div>

  );

}

export default TeacherLogin;