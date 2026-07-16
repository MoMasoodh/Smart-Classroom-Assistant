import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import api from "../services/api";
import { getStoredSessions, getActiveSession, updateStoredSession } from "../services/storage";

function ManageSession() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = location.state?.session || getActiveSession() || getStoredSessions()[0];
  const sessionCode = session?.sessionCode;

  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [closingSession, setClosingSession] = useState(false);
  const [quizTopic, setQuizTopic] = useState(session?.subject || "");
  const [quizTitle, setQuizTitle] = useState(session ? `${session.sessionName} Quiz` : "Class Quiz");
  const [quizDuration, setQuizDuration] = useState(5);
  const [questionCount, setQuestionCount] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (sessionCode) {
      loadSessionData();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [sessionCode]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, quizResponse] = await Promise.allSettled([
        api.get(`/sessions/${sessionCode}/stats`),
        api.get(`/quizzes/session/${sessionCode}`),
      ]);

      if (statsResponse.status === "fulfilled") {
        setStats(statsResponse.value.data);
      }

      if (quizResponse.status === "fulfilled") {
        setQuiz(quizResponse.value.data);
      } else {
        setQuiz(null);
      }

      if (statsResponse.status === "rejected" && quizResponse.status === "rejected") {
        setError(statsResponse.reason?.response?.data?.message || "Unable to load session data.");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load session data.");
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    if (!session?._id) {
      setError("Session record not found.");
      return;
    }

    try {
      setQuizLoading(true);
      await api.put(`/sessions/${session._id}/close`);
      updateStoredSession(session.sessionCode, { isActive: false });
      setToast("Session Closed");
      setStats((currentStats) => (currentStats ? { ...currentStats, status: "Closed" } : currentStats));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to close session.");
    } finally {
      setQuizLoading(false);
      setClosingSession(false);
    }
  };

  const publishQuiz = async (event) => {
    event.preventDefault();

    if (!quizTopic.trim()) {
      setError("Please enter a quiz topic.");
      return;
    }

    try {
      setQuizLoading(true);
      setError("");

      const aiResponse = await api.post("/ai/generate-quiz", {
        topic: quizTopic,
        numberOfQuestions: Number(questionCount),
      });

      const quizData = typeof aiResponse.data.quiz === "string" ? JSON.parse(aiResponse.data.quiz) : aiResponse.data.quiz;

      const createResponse = await api.post("/quizzes", {
        sessionCode,
        title: quizTitle,
        duration: Number(quizDuration),
        questions: quizData,
      });

      const startResponse = await api.put(`/quizzes/${createResponse.data._id}/start`);
      setQuiz(startResponse.data);
      updateStoredSession(session.sessionCode, { quizEnabled: true });
      setToast("Quiz Published");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to publish quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="app-page">
        <Sidebar teacher />
        <div className="content-with-sidebar">
          <Header title="Manage Session" subtitle="No session selected" />
          <main className="page-shell">
            <div className="empty-state">
              <strong>No session found.</strong>
              <p>Select a session from My Sessions or create a new one.</p>
              <div className="form-actions">
                <button className="primary-button" onClick={() => navigate("/my-sessions")}>My Sessions</button>
                <button className="secondary" onClick={() => navigate("/create-session")}>Create Session</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">

        <Header
          title="Manage Session"
          subtitle={`${session.sessionName} · ${session.subject} · ${session.sessionCode}`}
          actions={<button className="secondary" onClick={() => navigate("/my-sessions")}>My Sessions</button>}
        />

        <main className="page-shell page-grid">

          {loading ? <Loading label="Loading session details" /> : null}

          {error ? (
            <div className="error-state">
              <strong>Session unavailable</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              <section className="hero-card page-hero">
                <div>
                  <span className="eyebrow">Session overview</span>
                  <h2 style={{ margin: "0.75rem 0 0.35rem" }}>{session.sessionName}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Code {session.sessionCode} · {session.duration} minutes · {session.isActive === false ? "Closed" : "Active"}
                  </p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card hero-card">
                    <span className="eyebrow">Students</span>
                    <h3>{stats?.totalStudents ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow">Pending Doubts</span>
                    <h3>{stats?.pendingDoubts ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow">Answered Doubts</span>
                    <h3>{stats?.answeredDoubts ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow">Quiz Attempts</span>
                    <h3>{stats?.quizAttempts ?? 0}</h3>
                  </div>
                </div>
              </section>

              <div className="dashboard-grid">
                <button className="session-card" onClick={() => navigate("/pending-doubts", { state: { session } })}>
                  <span className="status-pill pending">Pending Doubts</span>
                  <h3>Review and answer new student questions</h3>
                  <p>Open the unresolved doubts queue for this session.</p>
                </button>

                <button className="session-card" onClick={() => navigate("/discussion", { state: { session } })}>
                  <span className="status-pill active">Answered Doubts</span>
                  <h3>Read the answered discussion feed</h3>
                  <p>Browse the resolved classroom conversation in newest-first order.</p>
                </button>

                <button className="session-card" onClick={() => navigate("/statistics", { state: { session } })}>
                  <span className="status-pill active">Statistics</span>
                  <h3>Open classroom analytics</h3>
                  <p>See participation, doubt activity, and quiz engagement.</p>
                </button>

                <button className="session-card" onClick={() => navigate("/leaderboard", { state: { session } })}>
                  <span className="status-pill active">Leaderboard</span>
                  <h3>Review quiz rankings</h3>
                  <p>See who scored highest in the current session.</p>
                </button>
              </div>

              <section className="form-card page-section">
                <div>
                  <span className="eyebrow">Quiz management</span>
                  <h3 style={{ margin: "0.7rem 0 0.35rem" }}>{quiz ? quiz.title : "No quiz published yet"}</h3>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Generate a quiz with AI, review the content, and publish it to students.
                  </p>
                </div>

                {quiz ? (
                  <div className="hero-card">
                    <span className="status-pill active">Published</span>
                    <p style={{ marginTop: "0.75rem" }}>Questions: {quiz.questions.length} · Duration: {quiz.duration} minutes</p>
                  </div>
                ) : null}

                <form className="page-section" onSubmit={publishQuiz}>
                  <div className="field-grid">
                    <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz title" />
                    <input value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} placeholder="Quiz topic" />
                    <input type="number" min="1" max="20" value={quizDuration} onChange={(e) => setQuizDuration(e.target.value)} placeholder="Duration (minutes)" />
                    <input type="number" min="1" max="10" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} placeholder="Questions" />
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={quizLoading}>
                      {quizLoading ? "Publishing..." : "Generate Quiz"}
                    </button>
                    <button type="button" className="danger" onClick={() => setClosingSession(true)}>
                      Close Session
                    </button>
                  </div>
                </form>
              </section>
            </>
          ) : null}

        </main>

      </div>

      <ConfirmDialog
        open={closingSession}
        title="Close Session"
        message="This session will be marked as closed and students will no longer be able to join."
        confirmLabel="Close Session"
        onConfirm={closeSession}
        onCancel={() => setClosingSession(false)}
      />

      <Toast message={toast} type="success" />
    </div>
  );
}

export default ManageSession;