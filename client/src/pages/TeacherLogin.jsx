import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css";

function TeacherLogin() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function login(e) {

    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password.");
      return;
    }

    // Backend login will be connected later

    navigate("/teacher-dashboard");

  }

  return (

    <div className="login-page">

      <div className="login-card">

        <h1>Teacher Login</h1>

        <p className="login-subtitle">
          Smart Classroom Assistant
        </p>

        <form onSubmit={login}>

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

          <button type="submit">
            Login
          </button>

        </form>

      </div>

    </div>

  );

}

export default TeacherLogin;