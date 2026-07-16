import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {

  const navigate = useNavigate();

  return (

    <div className="home-page">

      <Navbar />

      <main className="home">

        <section className="hero-card home-hero">
          <div className="hero-copy">
            <span className="eyebrow">AI-powered classroom workflow</span>
            <h1 className="title">
              Smart Classroom Assistant
            </h1>

            <p className="subtitle">
              QR-based classroom sessions, doubts, quizzes, and rankings in one polished dashboard.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigate("/student-login")}>
                Join as Student
              </button>
              <button className="secondary" onClick={() => navigate("/teacher-login")}>
                Teacher Login
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-stat">
              <strong>Sessions</strong>
              <span>QR + code based entry</span>
            </div>
            <div className="hero-stat">
              <strong>Doubts</strong>
              <span>Manual and AI answers</span>
            </div>
            <div className="hero-stat">
              <strong>Quizzes</strong>
              <span>Instant AI generation</span>
            </div>
          </div>
        </section>

        <div className="card-container">

          <article className="card">
            <div className="icon">👨‍🎓</div>
            <h2>Student</h2>
            <p>
              Join an active classroom session using your name and session code.
            </p>
            <button className="join-btn" onClick={() => navigate("/student-login")}>
              Join Session
            </button>
          </article>

          <article className="card">
            <div className="icon">👨‍🏫</div>
            <h2>Teacher</h2>
            <p>
              Login to create sessions, manage doubts, publish quizzes, and review analytics.
            </p>
            <button className="login-btn" onClick={() => navigate("/teacher-login")}>
              Teacher Login
            </button>
          </article>

        </div>

        <footer>
          Developed using React, Node.js, Express, MongoDB, and Gemini AI.
        </footer>

      </main>

    </div>

  );

}

export default Home;