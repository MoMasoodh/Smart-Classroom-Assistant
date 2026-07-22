import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import api from "../services/api";

function ManageSession() {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(location.state?.session || null);
  const sessionCode = session?.sessionCode;
  const quizSectionRef = useRef(null);

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

  useEffect(() => {
    setQuizTopic(session?.subject || "");
    setQuizTitle(session ? `${session.sessionName} Quiz` : "Class Quiz");
  }, [session?.subject, session?.sessionName]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError("");

      const [sessionResponse, quizResponse] = await Promise.allSettled([
        api.get(`/sessions/my-sessions/${session._id}`),
        api.get(`/quizzes/session/${sessionCode}`),
      ]);

      if (sessionResponse.status === "fulfilled") {
        setSession(sessionResponse.value.data.session);
        setStats(sessionResponse.value.data.stats);
      } else {
        setError(sessionResponse.reason?.response?.data?.message || "Unable to load session data.");
      }

      if (quizResponse.status === "fulfilled") {
        setQuiz(quizResponse.value.data);
      } else {
        setQuiz(null);
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
      const response = await api.put(`/sessions/${session._id}/close`);
      const updatedSession = response.data;

      setSession((currentSession) => ({
        ...currentSession,
        ...updatedSession,
        isActive: false,
        closedAt: updatedSession.closedAt || new Date().toISOString(),
      }));
      setStats((currentStats) => (currentStats ? { ...currentStats, status: "Closed" } : currentStats));
      setToast("Session Closed");
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
      setToast("Quiz Published");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to publish quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const openPendingDoubts = () => {
    navigate("/pending-doubts", { state: { session } });
  };

  const openAnsweredDoubts = () => {
    navigate("/discussion", { state: { session, teacherView: true } });
  };

  const openQuizSection = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!session) {
    return (
      <div className="app-page">
        <Sidebar teacher />
        <div className="content-with-sidebar">
          <Header
    title="Manage Session"
    subtitle="Session unavailable"
/>
          <main className="page-shell">
            <div className="empty-state">
              <strong>Session not found.</strong>
              <p>Please open one of your sessions from the My Sessions page.</p>
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

                <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                  <span className={`status-pill ${session.isActive === false ? "closed" : "active"}`}>
                    {session.isActive === false ? "Closed" : "Active"}
                  </span>
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
                <button className="session-card" onClick={openPendingDoubts}>
                  <span className="status-pill pending">Pending Doubts</span>
                  <h3>Review and answer new student questions</h3>
                  <p>Open the unresolved doubts queue for this session.</p>
                </button>

                <button className="session-card" onClick={openAnsweredDoubts}>
                  <span className="status-pill active">Answered Doubts</span>
                  <h3>Read the answered discussion feed</h3>
                  <p>Browse the resolved classroom conversation in newest-first order.</p>
                </button>

                <button className="session-card" onClick={openQuizSection}>
                  <span className="status-pill active">Quiz</span>
                  <h3>Publish or review the session quiz</h3>
                  <p>Jump to the quiz management section for this session.</p>
                </button>

                <button className="session-card" onClick={() => setClosingSession(true)}>
                  <span className="status-pill closed">Close Session</span>
                  <h3>End the classroom session</h3>
                  <p>Prevent new joins, doubts, and quiz access immediately.</p>
                </button>
              </div>

              <section className="hero-card page-section">
                <div className="field-grid">
                  <div>
                    <span className="eyebrow">Session details</span>
                    <h3 style={{ margin: "0.7rem 0 0.35rem" }}>{session.sessionName}</h3>
                    <p style={{ margin: 0, color: "var(--muted)" }}>{session.subject}</p>
                  </div>

                  <div className="hero-stat">
                    <strong>{session.sessionCode}</strong>
                    <span>Session code</span>
                  </div>
                  <div className="hero-stat">
                    <strong>{session.duration} min</strong>
                    <span>Duration</span>
                  </div>
                  <div className="hero-stat">
                    <strong>{session.createdAt ? new Date(session.createdAt).toLocaleString() : "—"}</strong>
                    <span>Created date</span>
                  </div>
                  <div className="hero-stat">
                    <strong>{session.closedAt ? new Date(session.closedAt).toLocaleString() : "—"}</strong>
                    <span>Closed date</span>
                  </div>
                </div>
              </section>

              <section className="hero-card page-section">
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

                <form className="page-section" onSubmit={publishQuiz} ref={quizSectionRef}>
                  <div className="field-grid">
                    <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz title" />
                    <input value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} placeholder="Quiz topic" />
                    <input type="number" min="1" max="20" value={quizDuration} onChange={(e) => setQuizDuration(e.target.value)} placeholder="Duration (minutes)" />
                    <input type="number" min="1" max="10" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} placeholder="Questions" />
                  </div>

                  {!session.isActive ? (
                    <div className="empty-state" style={{ marginTop: 0 }}>
                      <strong>This session is closed.</strong>
                      <p>You can still review statistics and answered doubts, but students can no longer join or take the quiz.</p>
                    </div>
                  ) : null}

                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={quizLoading || !session.isActive}>
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