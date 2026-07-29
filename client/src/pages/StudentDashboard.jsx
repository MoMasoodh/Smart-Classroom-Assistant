import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";
import {
  getStudentProfile,
  getActiveSession,
  clearActiveSession,
  clearStudentProfile,
  saveStoredSession,
  setActiveSession,
  setStudentProfile,
  getStudent,
} from "../services/storage";
import {
  HelpCircle,
  BookOpenCheck,
  MessageSquare,
  FileText,
  Trophy,
  LogOut,
  Sparkles,
  QrCode,
  LogIn,
  Radio,
} from "lucide-react";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const student = getStudent();

  const [session, setSession] = useState(() => {
    const candidate =
      location.state?.session ||
      getActiveSession() ||
      getStudentProfile()?.session;
    if (!candidate) return null;
    if (candidate.isActive === false) return null;
    if (candidate.expiresAt && new Date(candidate.expiresAt) <= new Date())
      return null;
    return candidate;
  });

  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    const currentSession = getActiveSession();
    if (currentSession) {
      if (
        currentSession.isActive === false ||
        (currentSession.expiresAt &&
          new Date(currentSession.expiresAt) <= new Date())
      ) {
        clearActiveSession();
        clearStudentProfile();
        setSession(null);
      }
    }
  }, []);

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const studentName = student?.student?.fullName || "Student";
  const registerNumber = student?.student?.registerNumber || "";

  const handleJoinSession = async (e) => {
    e.preventDefault();

    if (!sessionCodeInput.trim()) {
      setJoinError("Please enter a valid Session Code.");
      return;
    }

    try {
      setJoinLoading(true);
      setJoinError("");

      const response = await api.get(
        `/sessions/${sessionCodeInput.trim().toUpperCase()}`
      );
      const sessionData = response.data;

      if (sessionData.isActive === false) {
        setJoinError("This session has been closed by the teacher.");
        addToast("This session has been closed by the teacher.", "warning");
        return;
      }

      if (
        sessionData.expiresAt &&
        new Date(sessionData.expiresAt) <= new Date()
      ) {
        setJoinError("This session has expired.");
        addToast("This session has expired.", "warning");
        return;
      }

      setStudentProfile({
        studentName,
        registerNumber,
        sessionCode: sessionData.sessionCode,
        session: sessionData,
      });

      setActiveSession(sessionData);
      saveStoredSession(sessionData);
      setSession(sessionData);
      setSessionCodeInput("");
      addToast(`Joined classroom session ${sessionData.sessionCode}`, "success");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Unable to join session. Please verify the code.";
      setJoinError(msg);
      addToast(msg, "error");
    } finally {
      setJoinLoading(false);
    }
  };

  const confirmLeaveSession = () => {
    clearActiveSession();
    clearStudentProfile();
    setSession(null);
    setShowLeaveModal(false);
    addToast("You have left the classroom session.", "info");
  };

  const handleQuizClick = () => {
    if (!session?.isActive) {
      addToast("This classroom session is currently closed.", "warning");
      return;
    }

    navigate("/quiz", {
      state: {
        studentName,
        registerNumber,
        session,
      },
    });
  };

  return (
    <div className="app-page student-dashboard-page">
      <Sidebar />

      <div className="dashboard-content content-with-sidebar">
        <Header
          title="Student Dashboard"
          subtitle={
            session
              ? `Welcome, ${studentName} • Session: ${session.sessionCode}`
              : `Welcome, ${studentName}`
          }
          actions={
            session ? (
              <span className="status-pill active">
                <Radio size={14} />{" "}
                {session.isActive === false ? "Closed Session" : "Active Live Session"}
              </span>
            ) : null
          }
        />

        <main className="page-shell fade-in">
          {!session ? (
            <section
              className="form-card hero-card"
              style={{ maxWidth: "600px", margin: "2rem auto", padding: "2.5rem" }}
            >
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <QrCode size={28} />
                </div>
                <span className="eyebrow">Classroom Entry</span>
                <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.5rem" }}>
                  Join Active Classroom
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Enter the 6-character Session Code provided by your teacher.
                </p>
              </div>

              <form onSubmit={handleJoinSession} style={{ display: "grid", gap: "1.25rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="text"
                    placeholder="Enter Session Code (e.g. MATH101)"
                    value={sessionCodeInput}
                    onChange={(e) => setSessionCodeInput(e.target.value.toUpperCase())}
                    style={{
                      textTransform: "uppercase",
                      fontSize: "1.2rem",
                      letterSpacing: "0.08em",
                      textAlign: "center",
                      fontWeight: 700,
                      padding: "1rem",
                    }}
                  />
                </div>

                {joinError ? (
                  <p className="error-text" style={{ justifyContent: "center" }}>
                    {joinError}
                  </p>
                ) : null}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={joinLoading}
                  style={{ width: "100%", padding: "1rem" }}
                >
                  {joinLoading ? (
                    "Joining Classroom..."
                  ) : (
                    <>
                      <LogIn size={18} /> Join Classroom Session
                    </>
                  )}
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="hero-card page-hero" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <span className="eyebrow">
                    <Sparkles size={14} /> Student Classroom Portal
                  </span>
                  <h2 style={{ margin: "0.75rem 0 0.35rem", fontSize: "1.5rem" }}>
                    Ask questions, track answers, and participate in quizzes.
                  </h2>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Your doubt submissions and quiz scores are linked live to this classroom session.
                  </p>
                </div>

                <div
                  className="field-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <div className="hero-stat">
                    <strong>{session.sessionName}</strong>
                    <span>Subject: {session.subject}</span>
                  </div>
                  <div className="hero-stat" style={{ borderLeft: "3px solid var(--primary)" }}>
                    <strong style={{ color: "var(--primary)", fontFamily: "monospace" }}>
                      {session.sessionCode}
                    </strong>
                    <span>Classroom PIN</span>
                  </div>
                </div>
              </section>

              <div className="dashboard-grid">
                <DashboardCard
                  icon={<HelpCircle size={26} />}
                  title="Ask Doubt"
                  description="Submit a question directly to the teacher during live class."
                  onClick={() =>
                    navigate("/ask-doubt", {
                      state: {
                        studentName,
                        registerNumber,
                        session,
                      },
                    })
                  }
                />

                <DashboardCard
                  icon={<BookOpenCheck size={26} />}
                  title="My Doubts"
                  description="Review your submitted doubts and view teacher explanations."
                  onClick={() => {
                    navigate("/my-doubts", {
                      state: {
                        studentName,
                        registerNumber,
                        session,
                      },
                    });
                  }}
                />

                <DashboardCard
                  icon={<MessageSquare size={26} />}
                  title="Discussion"
                  description="Browse answered classroom doubts to help with your learning."
                  onClick={() =>
                    navigate("/discussion", {
                      state: {
                        studentName,
                        registerNumber,
                        session,
                      },
                    })
                  }
                />

                <DashboardCard
                  icon={<FileText size={26} />}
                  title="Quiz"
                  description="Participate in real-time topic quizzes published by the teacher."
                  onClick={handleQuizClick}
                />

                <DashboardCard
                  icon={<Trophy size={26} />}
                  title="Leaderboard"
                  description="View overall student rankings and test score benchmarks."
                  onClick={() =>
                    navigate("/leaderboard", {
                      state: {
                        studentName,
                        registerNumber,
                        session,
                      },
                    })
                  }
                />

                <DashboardCard
                  icon={<LogOut size={26} />}
                  title="Leave Session"
                  description="Disconnect from the active classroom session."
                  onClick={() => setShowLeaveModal(true)}
                />
              </div>
            </>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={showLeaveModal}
        title="Leave Classroom Session?"
        message="Are you sure you want to leave this session? You will need the Session Code to rejoin."
        confirmLabel="Leave Session"
        cancelLabel="Cancel"
        onConfirm={confirmLeaveSession}
        onCancel={() => setShowLeaveModal(false)}
        danger
      />
    </div>
  );
}

export default StudentDashboard;