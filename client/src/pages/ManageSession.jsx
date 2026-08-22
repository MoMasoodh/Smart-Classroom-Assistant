import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { SkeletonCard, SkeletonStat } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import { useToast } from "../contexts/ToastContext";

import api from "../services/api";
import { initSocket } from "../services/socket";
import LiveStudentList from "../components/LiveStudentList";
import SessionTimeline from "../components/SessionTimeline";
import {
  Sparkles,
  Save,
  Send,
  StopCircle,
  PlusCircle,
  Trash2,
  HelpCircle,
  MessageSquare,
  FileText,
  Lock,
  CheckCircle2,
  Users,
  QrCode,
  ArrowLeft,
  Clock,
} from "lucide-react";

const generateQuestionId = () => `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const createBlankQuestion = () => ({
  id: generateQuestionId(),
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

const normalizeQuestion = (question = {}) => ({
  id: question.id || generateQuestionId(),
  question: question.question || "",
  options: [0, 1, 2, 3].map((index) => question.options?.[index] || ""),
  correctAnswer: question.correctAnswer || "",
});

const normalizeQuestions = (questions = []) =>
  Array.isArray(questions) ? questions.map((question) => normalizeQuestion(question)) : [];

const getDraftKey = (sessionCode) => `manage-session-quiz-draft:${sessionCode}`;

const readQuizDraft = (sessionCode) => {
  if (!sessionCode || typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(getDraftKey(sessionCode));
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
};

const writeQuizDraft = (sessionCode, draft) => {
  if (!sessionCode || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getDraftKey(sessionCode), JSON.stringify(draft));
  } catch {
    // Ignore storage failures
  }
};

const clearQuizDraft = (sessionCode) => {
  if (!sessionCode || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getDraftKey(sessionCode));
  } catch {
    // Ignore storage failures
  }
};

function ManageSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [session, setSession] = useState(location.state?.session || null);
  const sessionCode = session?.sessionCode;
  const quizSectionRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [closingSession, setClosingSession] = useState(false);
  const [editTimeModalOpen, setEditTimeModalOpen] = useState(false);
  const [customExpiryInput, setCustomExpiryInput] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [quizTopic, setQuizTopic] = useState(location.state?.session?.subject || "");
  const [quizTitle, setQuizTitle] = useState(
    location.state?.session ? `${location.state.session.sessionName} Quiz` : "Class Quiz"
  );
  const [quizDuration, setQuizDuration] = useState(location.state?.session?.duration || 5);
  const [questionCount, setQuestionCount] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [savedQuizId, setSavedQuizId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Live countdown timer effect updating every 1s
  useEffect(() => {
    if (!session?.expiresAt || session?.isActive === false) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt, session?.isActive]);

  useEffect(() => {
    if (sessionCode) {
      loadSessionData(false);

      const socket = initSocket(sessionCode, "teacher");

      const handleSessionUpdate = () => {
        loadSessionData(true);
        setRefreshKey((prev) => prev + 1);
      };

      const handleTimelineEvent = (ev) => {
        if (ev.eventType === "STUDENT_JOINED") {
          addToast(`Student Joined: ${ev.title}`, "info");
        } else if (ev.eventType === "DOUBT_ASKED") {
          addToast(`New Doubt: ${ev.title}`, "warning");
        }
        setRefreshKey((prev) => prev + 1);
      };

      socket.on("session_updated", handleSessionUpdate);
      socket.on("timeline_event", handleTimelineEvent);

      const timer = setInterval(() => {
        loadSessionData(true);
      }, 15000);

      return () => {
        clearInterval(timer);
        socket.off("session_updated", handleSessionUpdate);
        socket.off("timeline_event", handleTimelineEvent);
      };
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [sessionCode]);

  const handleExtendSession = async (additionalMinutes, customDate) => {
    try {
      setQuizLoading(true);
      const currentSessionRecord = await resolveSessionRecord();
      if (!currentSessionRecord?._id) return;

      const payload = customDate
        ? { customExpiresAt: customDate }
        : { additionalMinutes: Number(additionalMinutes) };

      const res = await api.put(`/sessions/${currentSessionRecord._id}/time`, payload);
      setSession(res.data);
      setToast("Session Time Updated");
      addToast("Session duration and expiration time updated successfully!", "success");
      setEditTimeModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to update session time.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const formatCountdown = (secs) => {
    if (secs <= 0) return "EXPIRED";
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };


  useEffect(() => {
    if (!session) {
      return;
    }

    if (!quiz && !savedQuizId && generatedQuestions.length === 0) {
      setQuizTopic(session.subject || "");
      setQuizTitle(`${session.sessionName} Quiz`);
      setQuizDuration(session.duration || 5);
    }
  }, [session, quiz, savedQuizId, generatedQuestions.length]);

  useEffect(() => {
    if (!sessionCode) {
      return;
    }

    const hasQuizDraft = quiz || savedQuizId || generatedQuestions.length > 0;

    if (!hasQuizDraft) {
      clearQuizDraft(sessionCode);
      return;
    }

    writeQuizDraft(sessionCode, {
      quiz,
      savedQuizId,
      quizTopic,
      quizTitle,
      quizDuration,
      questionCount,
      generatedQuestions,
    });
  }, [
    sessionCode,
    quiz,
    savedQuizId,
    quizTopic,
    quizTitle,
    quizDuration,
    questionCount,
    generatedQuestions,
  ]);

  const applyQuizState = (quizData) => {
    const nextQuestions = normalizeQuestions(quizData?.questions || []);

    setQuiz(quizData || null);
    setSavedQuizId(quizData?._id || null);
    setGeneratedQuestions(nextQuestions);
    setQuizTitle(quizData?.title || (session ? `${session.sessionName} Quiz` : "Class Quiz"));
    setQuestionCount(nextQuestions.length || 5);
  };

  const resolveSessionRecord = async () => {
    if (session?._id) {
      return session;
    }

    const sessionsResponse = await api.get("/sessions/my-sessions");
    return sessionsResponse.data.find((item) => item.sessionCode === sessionCode) || null;
  };

  const loadSessionData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError("");

      const currentSession = await resolveSessionRecord();

      if (!currentSession?._id) {
        if (!isSilent) setError("Session record not found.");
        return;
      }

      const [sessionResponse, quizResponse] = await Promise.allSettled([
        api.get(`/sessions/my-sessions/${currentSession._id}`),
        api.get(`/quizzes/session/${sessionCode}`),
      ]);

      if (sessionResponse.status === "fulfilled") {
        setSession(sessionResponse.value.data.session);
        setStats(sessionResponse.value.data.stats);
      } else if (!isSilent) {
        setError(sessionResponse.reason?.response?.data?.message || "Unable to load session data.");
      }

      if (quizResponse.status === "fulfilled") {
        applyQuizState(quizResponse.value.data);
      } else {
        const draft = readQuizDraft(sessionCode);

        if (draft) {
          setQuiz(draft.quiz || null);
          setSavedQuizId(draft.savedQuizId || draft.quiz?._id || null);
          setQuizTopic(draft.quizTopic || currentSession.subject || "");
          setQuizTitle(draft.quizTitle || draft.quiz?.title || `${currentSession.sessionName} Quiz`);
          setQuizDuration(draft.quizDuration || currentSession.duration || 5);
          setQuestionCount(draft.questionCount || draft.generatedQuestions?.length || 5);
          setGeneratedQuestions(normalizeQuestions(draft.generatedQuestions || draft.quiz?.questions || []));
        } else {
          setQuiz(null);
          setSavedQuizId(null);
          setGeneratedQuestions([]);
          setQuestionCount(5);
        }
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load session data.");
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async () => {
    try {
      setQuizLoading(true);

      const currentSession = await resolveSessionRecord();

      if (!currentSession?._id) {
        setError("Session record not found.");
        return;
      }

      const response = await api.put(`/sessions/${currentSession._id}/close`);
      const updatedSession = response.data;

      setSession((currentSessionState) => ({
        ...currentSessionState,
        ...updatedSession,
        isActive: false,
        closedAt: updatedSession.closedAt || new Date().toISOString(),
      }));
      setStats((currentStats) => (currentStats ? { ...currentStats, status: "Closed" } : currentStats));
      setQuiz((currentQuiz) => (currentQuiz ? { ...currentQuiz, isActive: false } : currentQuiz));
      setToast("Session Closed");
      addToast(`Session "${session.sessionName}" has been closed.`, "info");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to close session.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
      setClosingSession(false);
    }
  };

  const generateQuiz = async (event) => {
    event.preventDefault();

    if (!quizTopic.trim()) {
      setError("Please enter a quiz topic.");
      return;
    }

    try {
      setQuizLoading(true);

      const response = await api.post("/ai/generate-quiz", {
        topic: quizTopic,
        numberOfQuestions: Number(questionCount),
      });

      const rawQuestions = response.data.quiz ?? response.data.questions ?? response.data;
      const parsedQuestions = typeof rawQuestions === "string" ? JSON.parse(rawQuestions) : rawQuestions;

      setQuiz(null);
      setSavedQuizId(null);
      setGeneratedQuestions(normalizeQuestions(parsedQuestions));
      setToast("Quiz Generated Successfully");
      addToast("Quiz questions generated successfully!", "success");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to generate quiz.";
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!sessionCode) {
      setError("Session code not found.");
      return;
    }

    if (!generatedQuestions.length) {
      setError("Add at least one question before saving.");
      return;
    }

    try {
      setQuizLoading(true);
      setError("");

      const response = await api.post("/quizzes", {
        sessionCode,
        title: quizTitle,
        duration: Number(quizDuration),
        questions: generatedQuestions,
      });

      setSavedQuizId(response.data._id);
      setQuiz(response.data);
      setGeneratedQuestions(normalizeQuestions(response.data.questions || generatedQuestions));
      setQuestionCount(response.data.questions?.length || generatedQuestions.length);
      setToast("Quiz Saved");
      addToast("Quiz saved successfully! Click 'Publish Quiz' to start it for students.", "success");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to save quiz.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const publishQuiz = async () => {
    const quizId = savedQuizId || quiz?._id;

    if (!quizId) {
      setError("Save quiz before publishing.");
      return;
    }

    try {
      setQuizLoading(true);
      setError("");

      const response = await api.put(`/quizzes/${quizId}/start`);

      setSavedQuizId(response.data._id || quizId);
      setQuiz(response.data);
      setGeneratedQuestions(normalizeQuestions(response.data.questions || generatedQuestions));
      setToast("Quiz Published");
      addToast("Quiz is now LIVE! Students can take the quiz.", "success");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to publish quiz.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const stopQuiz = async () => {
    const quizId = savedQuizId || quiz?._id;

    if (!quizId) {
      setError("Save quiz before stopping it.");
      return;
    }

    try {
      setQuizLoading(true);
      setError("");

      const response = await api.put(`/quizzes/${quizId}/stop`);

      setSavedQuizId(response.data._id || quizId);
      setQuiz(response.data);
      setToast("Quiz Stopped");
      addToast("Quiz has been stopped.", "info");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to stop quiz.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const updateQuestion = (index, field, value) => {
    setGeneratedQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];

      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value,
      };

      return nextQuestions;
    });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setGeneratedQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions];
      const nextQuestion = nextQuestions[questionIndex] || createBlankQuestion();
      const nextOptions = [...(nextQuestion.options || ["", "", "", ""])];

      nextOptions[optionIndex] = value;
      nextQuestions[questionIndex] = {
        ...nextQuestion,
        options: nextOptions,
      };

      return nextQuestions;
    });
  };

  const deleteQuestion = (index) => {
    setGeneratedQuestions((currentQuestions) => currentQuestions.filter((_, questionIndex) => questionIndex !== index));
  };

  const addQuestion = () => {
    setGeneratedQuestions((currentQuestions) => [...currentQuestions, createBlankQuestion()]);
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

  const isExpired = session?.expiresAt && new Date(session.expiresAt) <= new Date();
  const isSessionClosed = session?.isActive === false || isExpired;
  const hasQuiz = Boolean(quiz || savedQuizId);
  const quizStatus = quiz?.isActive ? "Published Live" : hasQuiz ? "Saved Draft" : "No Quiz";

  if (!session) {
    return (
      <div className="app-page">
        <Sidebar teacher />
        <div className="content-with-sidebar">
          <Header title="Manage Session" subtitle="Session unavailable" />
          <main className="page-shell fade-in">
            <div className="empty-state">
              <HelpCircle size={48} />
              <strong>Session not found.</strong>
              <p>Select an active session from your sessions list.</p>
              <div className="form-actions">
                <button className="primary-button" onClick={() => navigate("/my-sessions")}>
                  <BookOpen size={16} /> My Sessions
                </button>
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
          title="Manage Classroom Session"
          subtitle={`${session.sessionName} • Subject: ${session.subject} • PIN: ${session.sessionCode}`}
          actions={
            <button className="secondary" onClick={() => navigate("/my-sessions")}>
              <ArrowLeft size={16} /> Back to Sessions
            </button>
          }
        />

        <main className="page-shell page-grid fade-in">
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
            </div>
          ) : null}

          {error && !loading ? (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Session error</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              {/* Hero Banner with Stats & Session Time Management */}
              <section className="hero-card page-hero">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span className="eyebrow">
                      <Sparkles size={14} /> Classroom Control Panel
                    </span>
                    <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.5rem" }}>{session.sessionName}</h2>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                      PIN Code: <strong style={{ fontFamily: "monospace", fontSize: "1.05rem" }}>{session.sessionCode}</strong> • Subject: <strong>{session.subject}</strong>
                    </p>
                  </div>

                  {/* Active Session Time Management Panel */}
                  <div style={{ background: "var(--surface-alt)", padding: "0.85rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", minWidth: "240px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <Clock size={16} style={{ color: remainingSeconds > 0 && !isSessionClosed ? "var(--success)" : "var(--danger)" }} />
                      <span className={`status-pill ${isSessionClosed ? "closed" : remainingSeconds > 0 ? "active" : "pending"}`}>
                        {isSessionClosed ? "CLOSED" : remainingSeconds > 0 ? "LIVE" : "EXPIRED"}
                      </span>
                    </div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "monospace", color: remainingSeconds > 0 && !isSessionClosed ? "var(--text)" : "var(--danger)" }}>
                      {isSessionClosed ? "00:00" : formatCountdown(remainingSeconds)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Ends at: {session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                    {!isSessionClosed && (
                      <button
                        className="secondary"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
                        onClick={() => setEditTimeModalOpen(true)}
                      >
                        <Clock size={12} /> Edit Time / Extend
                      </button>
                    )}
                  </div>
                </div>


                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
                  <div className="stat-card hero-card">
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Users size={12} /> Students
                    </span>
                    <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{stats?.totalStudents ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--warning)", background: "var(--warning-bg)" }}>
                      <HelpCircle size={12} /> Pending Doubts
                    </span>
                    <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0", color: "var(--warning)" }}>{stats?.pendingDoubts ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--success)", background: "var(--success-bg)" }}>
                      <CheckCircle2 size={12} /> Answered
                    </span>
                    <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0", color: "var(--success)" }}>{stats?.answeredDoubts ?? 0}</h3>
                  </div>
                  <div className="stat-card hero-card">
                    <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <FileText size={12} /> Quiz Submissions
                    </span>
                    <h3 style={{ fontSize: "1.8rem", margin: "0.4rem 0 0" }}>{stats?.quizAttempts ?? 0}</h3>
                  </div>
                </div>
              </section>

              {/* Quick Action Navigation Grid */}
              <div className="dashboard-grid">
                <button className="dashboard-card" onClick={openPendingDoubts}>
                  <div className="card-icon" style={{ color: "var(--warning)", background: "var(--warning-bg)" }}>
                    <HelpCircle size={24} />
                  </div>
                  <h2>Pending Doubts ({stats?.pendingDoubts ?? 0})</h2>
                  <p>Review and answer unanswered student questions queue.</p>
                  <div className="dashboard-card-footer">
                    <span className="status-pill pending">Open Queue</span>
                  </div>
                </button>

                <button className="dashboard-card" onClick={openAnsweredDoubts}>
                  <div className="card-icon" style={{ color: "var(--success)", background: "var(--success-bg)" }}>
                    <MessageSquare size={24} />
                  </div>
                  <h2>Discussion Feed</h2>
                  <p>Browse resolved classroom doubts and teacher responses.</p>
                  <div className="dashboard-card-footer">
                    <span className="status-pill active">View Feed</span>
                  </div>
                </button>

                <button className="dashboard-card" onClick={openQuizSection}>
                  <div className="card-icon" style={{ color: "var(--primary)", background: "var(--primary-light)" }}>
                    <FileText size={24} />
                  </div>
                  <h2>AI Quiz Studio</h2>
                  <p>Generate, edit, and publish topic assessment quizzes.</p>
                  <div className="dashboard-card-footer">
                    <span className="status-pill active">{quizStatus}</span>
                  </div>
                </button>

                <button
                  className="dashboard-card"
                  onClick={() => setClosingSession(true)}
                  disabled={isSessionClosed}
                >
                  <div className="card-icon" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>
                    <Lock size={24} />
                  </div>
                  <h2>Close Session</h2>
                  <p>End student doubt submissions and quiz participation.</p>
                  <div className="dashboard-card-footer">
                    <span className={`status-pill ${isSessionClosed ? "closed" : "error"}`}>
                      {isSessionClosed ? "Closed" : "End Session"}
                    </span>
                  </div>
                </button>
              </div>

              {/* QR Code & Session Details Card */}
              <section className="hero-card page-section" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "1.5rem", alignItems: "center" }}>
                <div>
                  <span className="eyebrow">
                    <QrCode size={14} /> Classroom Shareable Credentials
                  </span>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.3rem" }}>Student Access Info</h3>
                  <p style={{ margin: "0 0 1rem", color: "var(--text-muted)" }}>
                    Project this QR code or share the 6-character PIN code with your students to let them join.
                  </p>

                  <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                    <div className="hero-stat">
                      <strong style={{ fontFamily: "monospace", color: "var(--primary)" }}>{session.sessionCode}</strong>
                      <span>Session PIN</span>
                    </div>
                    <div className="hero-stat">
                      <strong>{session.duration} min</strong>
                      <span>Duration</span>
                    </div>
                    <div className="hero-stat">
                      <strong>{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "—"}</strong>
                      <span>Created</span>
                    </div>
                  </div>
                </div>

                {session.qrCode && (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={session.qrCode}
                      alt="Session QR code"
                      style={{ width: "180px", height: "180px", borderRadius: "14px", border: "1px solid var(--border)", background: "white", padding: "0.5rem" }}
                    />
                  </div>
                )}
              </section>

              {/* Live Real-time Student Roster */}
              <LiveStudentList sessionCode={session.sessionCode} refreshKey={refreshKey} />

              {/* Real-time Session Timeline */}
              <SessionTimeline sessionCode={session.sessionCode} refreshKey={refreshKey} />

              {/* AI Quiz Management Studio */}
              <section className="hero-card page-section" ref={quizSectionRef}>
                <div>
                  <span className="eyebrow">
                    <Sparkles size={14} /> Gemini AI Quiz Builder
                  </span>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.4rem" }}>
                    {quiz?.title || quizTitle || "Classroom Assessment Quiz"}
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Automatically generate questions using Gemini AI, customize question options, then publish live.
                  </p>
                </div>

                <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: "1rem" }}>
                  <span className={`status-pill ${quiz?.isActive ? "active" : "closed"}`}>
                    {quizStatus}
                  </span>
                  {quiz ? (
                    <span className="status-pill active">
                      Published Questions: {quiz.questions?.length || 0}
                    </span>
                  ) : null}
                  <span className="status-pill pending">Editor Questions: {generatedQuestions.length}</span>
                </div>

                <form className="page-section" onSubmit={generateQuiz} style={{ display: "grid", gap: "1rem", marginTop: "1.25rem" }}>
                  <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Quiz Title</label>
                      <input
                        value={quizTitle}
                        onChange={(event) => setQuizTitle(event.target.value)}
                        placeholder="Quiz Title"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Topic / Prompt</label>
                      <input
                        value={quizTopic}
                        onChange={(event) => setQuizTopic(event.target.value)}
                        placeholder="Quiz Topic"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={quizDuration}
                        onChange={(event) => setQuizDuration(event.target.value)}
                        placeholder="Duration"
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Number of Questions</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={questionCount}
                        onChange={(event) => setQuestionCount(event.target.value)}
                        placeholder="Questions"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={quizLoading || isSessionClosed}
                    >
                      <Sparkles size={16} /> {quizLoading ? "Generating Questions..." : "Generate AI Quiz"}
                    </button>
                  </div>
                </form>

                {generatedQuestions.length > 0 ? (
                  <div className="page-section" style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
                    {generatedQuestions.map((question, questionIndex) => (
                      <section className="hero-card" key={question.id || `q-${questionIndex}`}>
                        <div className="form-actions" style={{ justifyContent: "space-between", margin: 0, paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                          <span className="eyebrow">Question #{questionIndex + 1}</span>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => deleteQuestion(questionIndex)}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        <div style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label>Question Text</label>
                            <textarea
                              value={question.question}
                              onChange={(event) => updateQuestion(questionIndex, "question", event.target.value)}
                              placeholder="Type question text..."
                              rows={2}
                            />
                          </div>

                          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Option A</label>
                              <input
                                value={question.options?.[0] || ""}
                                onChange={(event) => updateOption(questionIndex, 0, event.target.value)}
                                placeholder="Option A"
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Option B</label>
                              <input
                                value={question.options?.[1] || ""}
                                onChange={(event) => updateOption(questionIndex, 1, event.target.value)}
                                placeholder="Option B"
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Option C</label>
                              <input
                                value={question.options?.[2] || ""}
                                onChange={(event) => updateOption(questionIndex, 2, event.target.value)}
                                placeholder="Option C"
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Option D</label>
                              <input
                                value={question.options?.[3] || ""}
                                onChange={(event) => updateOption(questionIndex, 3, event.target.value)}
                                placeholder="Option D"
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ color: "var(--success)" }}>Correct Answer (Exact String Match)</label>
                            <input
                              value={question.correctAnswer || ""}
                              onChange={(event) => updateQuestion(questionIndex, "correctAnswer", event.target.value)}
                              placeholder="Paste or type exact correct option string..."
                              style={{ borderColor: "var(--success-border)" }}
                            />
                          </div>
                        </div>
                      </section>
                    ))}

                    <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                      <button type="button" className="secondary" onClick={addQuestion}>
                        <PlusCircle size={16} /> Add Custom Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state" style={{ marginTop: "1rem" }}>
                    <FileText size={48} />
                    <strong>No Questions in Quiz Editor</strong>
                    <p>Click "Generate AI Quiz" above or add a blank question manually.</p>
                    <button type="button" className="secondary" onClick={addQuestion}>
                      <PlusCircle size={16} /> Add Blank Question
                    </button>
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: "1.5rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={saveQuiz}
                    disabled={quizLoading || isSessionClosed || generatedQuestions.length === 0}
                  >
                    <Save size={16} /> Save Quiz Draft
                  </button>

                  <button
                    type="button"
                    className="button"
                    onClick={publishQuiz}
                    disabled={quizLoading || isSessionClosed || !savedQuizId}
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}
                  >
                    <Send size={16} /> Publish Quiz Live
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={stopQuiz}
                    disabled={quizLoading || !quiz?.isActive}
                  >
                    <StopCircle size={16} /> Stop Active Quiz
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      <ConfirmDialog
        open={closingSession}
        title="Close Classroom Session?"
        message="This session will be marked as closed. Students will no longer be able to join, ask doubts, or attempt quizzes."
        confirmLabel="Close Session"
        onConfirm={closeSession}
        onCancel={() => setClosingSession(false)}
        danger
      />

      {editTimeModalOpen && (
        <div className="modal-backdrop fade-in">
          <div className="modal-card hero-card" style={{ width: "min(100%, 480px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Clock size={20} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0 }}>Edit Active Session Time</h3>
            </div>
            <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Current end time:{" "}
              <strong>
                {session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </strong>
            </p>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>
                  Quick Extension
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="secondary" onClick={() => handleExtendSession(15)}>
                    +15 mins
                  </button>
                  <button type="button" className="secondary" onClick={() => handleExtendSession(30)}>
                    +30 mins
                  </button>
                  <button type="button" className="secondary" onClick={() => handleExtendSession(60)}>
                    +60 mins
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Set Custom End Time</label>
                <input
                  type="datetime-local"
                  value={customExpiryInput}
                  onChange={(e) => setCustomExpiryInput(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: "1.5rem" }}>
              <button type="button" className="secondary" onClick={() => setEditTimeModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (customExpiryInput) {
                    handleExtendSession(null, customExpiryInput);
                  } else {
                    addToast("Select quick extension or pick a custom end time.", "warning");
                  }
                }}
              >
                Update Session Time
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} type="success" />
    </div>
  );
}

export default ManageSession;

