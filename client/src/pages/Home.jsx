import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { GraduationCap, UserCheck, Sparkles, QrCode, HelpCircle, FileCheck, ArrowRight, ShieldCheck } from "lucide-react";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      <main className="home fade-in">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> AI-Powered Classroom Platform
            </span>
            <h1 className="title">
              Interactive Learning & Real-Time Engagement
            </h1>

            <p className="subtitle">
              QR-based classroom entry, real-time student doubt management with AI-assisted answers, automated quizzes, and class leaderboards.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigate("/student-login")}>
                <GraduationCap size={18} /> Student Portal <ArrowRight size={16} />
              </button>
              <button className="secondary" onClick={() => navigate("/teacher-login")}>
                <UserCheck size={18} /> Teacher Portal
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-stat">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <QrCode size={18} style={{ color: "var(--primary)" }} />
                <strong>QR Classroom Entry</strong>
              </div>
              <span>Scan QR code or enter code to join sessions instantly</span>
            </div>
            <div className="hero-stat">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HelpCircle size={18} style={{ color: "var(--accent)" }} />
                <strong>Doubt Resolution</strong>
              </div>
              <span>Submit doubts in real-time with teacher and AI responses</span>
            </div>
            <div className="hero-stat">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileCheck size={18} style={{ color: "var(--success)" }} />
                <strong>Instant AI Quizzes</strong>
              </div>
              <span>Auto-generated topic quizzes with live scoring</span>
            </div>
          </div>
        </section>

        {/* Portal Selection Section */}
        <div className="card-container">
          <article className="card">
            <div className="card-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <GraduationCap size={32} />
            </div>
            <h2>Student Portal</h2>
            <p>
              Join live classroom sessions, submit questions directly to your teacher, track answered doubts, take automated quizzes, and check rankings on the leaderboard.
            </p>
            <div className="card-actions">
              <button className="join-btn primary-button" onClick={() => navigate("/student-login")}>
                Student Login
              </button>
              <button className="secondary" onClick={() => navigate("/student-register")}>
                Create Student Account
              </button>
            </div>
          </article>

          <article className="card">
            <div className="card-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              <UserCheck size={32} />
            </div>
            <h2>Teacher Portal</h2>
            <p>
              Create classroom sessions, generate shareable QR codes, review pending doubts with AI answer assistance, publish custom topic quizzes, and view analytics.
            </p>
            <div className="card-actions">
              <button className="login-btn primary-button" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }} onClick={() => navigate("/teacher-login")}>
                Teacher Login
              </button>
              <button className="secondary" onClick={() => navigate("/teacher-register")}>
                Create Teacher Account
              </button>
            </div>
          </article>
        </div>

        <footer>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
            <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
            <span>Built with React, Vite, Node.js, Express, MongoDB, and Gemini AI</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Home;