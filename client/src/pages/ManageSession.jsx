import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";

import api from "../services/api";

const createBlankQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

const normalizeQuestion = (question = {}) => ({
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
    // Ignore storage failures and keep the page functional.
  }
};

const clearQuizDraft = (sessionCode) => {
  if (!sessionCode || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getDraftKey(sessionCode));
  } catch {
    // Ignore storage failures and keep the page functional.
  }
};

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
  const [quizTopic, setQuizTopic] = useState(location.state?.session?.subject || "");
  const [quizTitle, setQuizTitle] = useState(
    location.state?.session ? `${location.state.session.sessionName} Quiz` : "Class Quiz"
  );
  const [quizDuration, setQuizDuration] = useState(location.state?.session?.duration || 5);
  const [questionCount, setQuestionCount] = useState(5);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [savedQuizId, setSavedQuizId] = useState(null);

  useEffect(() => {
    if (sessionCode) {
      loadSessionData();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [sessionCode]);

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

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError("");

      const currentSession = await resolveSessionRecord();

      if (!currentSession?._id) {
        setError("Session not found.");
        return;
      }

      const [sessionResponse, quizResponse] = await Promise.allSettled([
        api.get(`/sessions/my-sessions/${currentSession._id}`),
        api.get(`/quizzes/session/${sessionCode}`),
      ]);

      if (sessionResponse.status === "fulfilled") {
        setSession(sessionResponse.value.data.session);
        setStats(sessionResponse.value.data.stats);
      } else {
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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to close session.");
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
      setError("");

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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!sessionCode) {
      setError("Session not found.");
      return;
    }

    if (!generatedQuestions.length) {
      setError("Generate or add at least one question before saving.");
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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save quiz.");
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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to publish quiz.");
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
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to stop quiz.");
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

  const isSessionClosed = session?.isActive === false;
  const hasQuiz = Boolean(quiz || savedQuizId);
  const quizStatus = quiz?.isActive ? "Published" : hasQuiz ? "Saved Draft" : "No Quiz";

  if (!session) {
    return (
      <div className="app-page">
        <Sidebar teacher />
        <div className="content-with-sidebar">
          <Header title="Manage Session" subtitle="Session unavailable" />
          <main className="page-shell">
            <div className="empty-state">
              <strong>Session not found.</strong>
              <p>Please open one of your sessions from the My Sessions page.</p>
              <div className="form-actions">
                <button className="primary-button" onClick={() => navigate("/my-sessions")}>
                  My Sessions
                </button>
                <button className="secondary" onClick={() => navigate("/create-session")}>
                  Create Session
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
          title="Manage Session"
          subtitle={`${session.sessionName} · ${session.subject} · ${session.sessionCode}`}
          actions={
            <button className="secondary" onClick={() => navigate("/my-sessions")}>
              My Sessions
            </button>
          }
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
                    Code {session.sessionCode} · {session.duration} minutes · {isSessionClosed ? "Closed" : "Active"}
                  </p>
                </div>

                <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                  <span className={`status-pill ${isSessionClosed ? "closed" : "active"}`}>
                    {isSessionClosed ? "Closed" : "Active"}
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

              <section className="hero-card page-section" ref={quizSectionRef}>
                <div>
                  <span className="eyebrow">Quiz management</span>
                  <h3 style={{ margin: "0.7rem 0 0.35rem" }}>
                    {quiz?.title || quizTitle || "No quiz published yet"}
                  </h3>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Generate a quiz with AI, edit the questions, then save and publish it for students.
                  </p>
                </div>

                <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                  <span className={`status-pill ${quiz?.isActive ? "active" : "closed"}`}>
                    {quizStatus}
                  </span>
                  {quiz ? (
                    <span className="status-pill active">
                      Questions: {quiz.questions?.length || generatedQuestions.length || 0}
                    </span>
                  ) : null}
                  <span className="status-pill pending">Draft Questions: {generatedQuestions.length}</span>
                </div>

                {quiz && !quiz.isActive ? (
                  <div className="hero-card" style={{ marginTop: "1rem" }}>
                    <strong>Draft available</strong>
                    <p style={{ marginBottom: 0, color: "var(--muted)" }}>
                      Edit the generated questions below, then save and publish when ready.
                    </p>
                  </div>
                ) : null}

                <form className="page-section" onSubmit={generateQuiz}>
                  <div className="field-grid">
                    <input
                      value={quizTitle}
                      onChange={(event) => setQuizTitle(event.target.value)}
                      placeholder="Quiz title"
                    />
                    <input
                      value={quizTopic}
                      onChange={(event) => setQuizTopic(event.target.value)}
                      placeholder="Quiz topic"
                    />
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={quizDuration}
                      onChange={(event) => setQuizDuration(event.target.value)}
                      placeholder="Duration (minutes)"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={questionCount}
                      onChange={(event) => setQuestionCount(event.target.value)}
                      placeholder="Questions"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={quizLoading || isSessionClosed}
                    >
                      {quizLoading ? "Generating..." : "Generate AI Quiz"}
                    </button>
                  </div>
                </form>

                {generatedQuestions.length > 0 ? (
                  <div className="page-section">
                    {generatedQuestions.map((question, questionIndex) => (
                      <section className="hero-card" key={`${questionIndex}-${question.question || "question"}`}>
                        <div className="form-actions" style={{ justifyContent: "space-between" }}>
                          <strong>Question {questionIndex + 1}</strong>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => deleteQuestion(questionIndex)}
                          >
                            Delete Question
                          </button>
                        </div>

                        <div className="field-grid" style={{ marginTop: "1rem" }}>
                          <textarea
                            value={question.question}
                            onChange={(event) => updateQuestion(questionIndex, "question", event.target.value)}
                            placeholder="Question text"
                            rows={3}
                          />

                          <input
                            value={question.options?.[0] || ""}
                            onChange={(event) => updateOption(questionIndex, 0, event.target.value)}
                            placeholder="Option A"
                          />
                          <input
                            value={question.options?.[1] || ""}
                            onChange={(event) => updateOption(questionIndex, 1, event.target.value)}
                            placeholder="Option B"
                          />
                          <input
                            value={question.options?.[2] || ""}
                            onChange={(event) => updateOption(questionIndex, 2, event.target.value)}
                            placeholder="Option C"
                          />
                          <input
                            value={question.options?.[3] || ""}
                            onChange={(event) => updateOption(questionIndex, 3, event.target.value)}
                            placeholder="Option D"
                          />
                          <input
                            value={question.correctAnswer || ""}
                            onChange={(event) => updateQuestion(questionIndex, "correctAnswer", event.target.value)}
                            placeholder="Correct Answer"
                          />
                        </div>
                      </section>
                    ))}

                    <div className="form-actions">
                      <button type="button" className="secondary" onClick={addQuestion}>
                        Add Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state" style={{ marginTop: "1rem" }}>
                    <strong>No generated questions yet.</strong>
                    <p>Generate an AI quiz to start editing questions, or add a blank question manually.</p>
                    <button type="button" className="secondary" onClick={addQuestion}>
                      Add Blank Question
                    </button>
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={saveQuiz}
                    disabled={quizLoading || isSessionClosed || generatedQuestions.length === 0}
                  >
                    Save Quiz
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={publishQuiz}
                    disabled={quizLoading || isSessionClosed || !savedQuizId}
                  >
                    Publish Quiz
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={stopQuiz}
                    disabled={quizLoading || !quiz?.isActive}
                  >
                    Stop Quiz
                  </button>
                </div>

                {!session.isActive ? (
                  <div className="empty-state" style={{ marginTop: 0 }}>
                    <strong>This session is closed.</strong>
                    <p>
                      You can still review statistics and answered doubts, but students can no longer join or take the quiz.
                    </p>
                  </div>
                ) : null}
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
