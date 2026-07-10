import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

  const navigate = useNavigate();

  return (

    <div className="home">

      <h1 className="title">
        Smart Classroom Assistant
      </h1>

      <p className="subtitle">
        QR Based Classroom Doubt & Quiz Management System
      </p>

      <div className="card-container">

        <div className="card">

          <div className="icon">👨‍🎓</div>

          <h2>Student</h2>

          <p>
            Join an active classroom session
            using your name and session code.
          </p>

          <button
            className="join-btn"
            onClick={() => navigate("/student-login")}
          >
            Join Session
          </button>

        </div>

        <div className="card">

          <div className="icon">👨‍🏫</div>

          <h2>Teacher</h2>

          <p>
            Login to create sessions,
            manage doubts and quizzes.
          </p>

          <button
            className="login-btn"
            onClick={() => navigate("/teacher-login")}
          >
            Teacher Login
          </button>

        </div>

      </div>

      <footer>

        Developed using
        React • Node.js • Express • MongoDB • Gemini AI

      </footer>

    </div>

  );

}

export default Home;