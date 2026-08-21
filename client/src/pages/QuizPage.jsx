import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import QuizRevisionModal from "../components/QuizRevisionModal";
import api from "../services/api";
import { getActiveSession, getStudentProfile, getStudent } from "../services/storage";
import { initSocket } from "../services/socket";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Award,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import "./QuizPage.css";

import { useStudentSessionSocket } from "../hooks/useStudentSessionSocket";

function QuizPage() {
  useStudentSessionSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const student = getStudent();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();
  const studentName = location.state?.studentName || storedProfile?.studentName || student?.student?.fullName || "Student";
  const registerNumber = location.state?.registerNumber || storedProfile?.registerNumber || student?.student?.registerNumber || "";
  const sessionCode = session?.sessionCode || "";

  const draftKey = `quiz-draft-answers:${sessionCode}:${registerNumber || studentName}`;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadQuiz = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError("");

      const checkRes = await api.get(
        `/results/check/${sessionCode}/${encodeURIComponent(studentName)}?registerNumber=${registerNumber}`
      );

      if (checkRes.data?.alreadySubmitted) {
        const res = checkRes.data.result;
        const totalQ = res.totalQuestions || 5;
        const pct = Math.round((res.score / totalQ) * 100);
        setSubmittedResult({
          score: res.score,
          totalQuestions: totalQ,
          percentage: pct,
        });
        if (!isSilent) setLoading(false);
        return;
      }

      const sessionResponse = await api.get(`/sessions/${sessionCode}`);
      if (sessionResponse.data.isActive === false) {
        setError("This classroom session has been closed by the teacher.");
        if (!isSilent) setLoading(false);
        return;
      }

      const response = await api.get(`/quizzes/session/${sessionCode}`);
      const quizData = response.data;
      setQuiz(quizData);

      let savedDraft = [];
      try {
        const storedDraft = localStorage.getItem(draftKey);
        if (storedDraft) {
          savedDraft = JSON.parse(storedDraft);
        }
      } catch {
        savedDraft = [];
      }

      const initialAnswers = new Array(quizData.questions.length).fill("");
      if (Array.isArray(savedDraft)) {
        savedDraft.forEach((val, idx) => {
          if (idx < initialAnswers.length && typeof val === "string") {
            initialAnswers[idx] = val;
          }
        });
      }

      setAnswers(initialAnswers);
      const totalSeconds = (quizData.timeLimitMinutes || 5) * 60;
      setRemainingSeconds(totalSeconds);
    } catch (err) {
      console.error("Error loading quiz:", err);
      setError(err.response?.data?.message || "Failed to load quiz.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [sessionCode, studentName, registerNumber, draftKey]);

  useEffect(() => {
    if (!sessionCode) {
      setError("No active session code found. Please join a session first.");
      setLoading(false);
      return;
    }
    loadQuiz();
  }, [sessionCode, loadQuiz]);

  // Socket listener to auto-load quiz silently when teacher publishes it live
  useEffect(() => {
    if (!sessionCode) return;

    const studentId = student?.student?._id || student?.student?.id;
    const studentReg = student?.student?.registerNumber || registerNumber;
    const studentFullName = student?.student?.fullName || studentName;

    const studentData = {
      studentId,
      registerNumber: studentReg,
      fullName: studentFullName,
    };

    const socket = initSocket(sessionCode, "student", studentData);

    const handleSessionUpdated = () => {
      loadQuiz(true);
    };

    const handleTimelineEvent = (ev) => {
      if (ev.eventType === "QUIZ_STARTED") {
        loadQuiz(true);
      }
    };

    socket.on("session_updated", handleSessionUpdated);
    socket.on("timeline_event", handleTimelineEvent);

    return () => {
      socket.off("session_updated", handleSessionUpdated);
      socket.off("timeline_event", handleTimelineEvent);
    };
  }, [sessionCode, loadQuiz, registerNumber, studentName]);

  useEffect(() => {
    if (!quiz || submittedResult || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, submittedResult, remainingSeconds]);

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const selectAnswer = (option) => {
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = option;
    setAnswers(nextAnswers);

    try {
      localStorage.setItem(draftKey, JSON.stringify(nextAnswers));
    } catch {
      // Ignore storage write errors
    }
  };

  const submitQuiz = async (isAuto = false) => {
    if (!quiz || submitting || submittedResult) return;

    try {
      setSubmitting(true);
      setShowReviewModal(false);

      const score = quiz.questions.reduce(
        (total, q, i) => total + (answers[i] === q.correctAnswer ? 1 : 0),
        0
      );

      const totalQuestions = quiz.questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      const answersArray = quiz.questions.map((q, i) => ({
        questionIndex: i,
        questionText: q.question,
        options: q.options || [],
        selectedOption: answers[i] || "",
        correctAnswer: q.correctAnswer,
        isCorrect: answers[i] === q.correctAnswer,
      }));

      await api.post("/results", {
        sessionCode,
        studentName,
        registerNumber,
        score,
        totalQuestions,
        answers: answersArray,
      });

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Ignore storage removal errors
      }

      setSubmittedResult({
        score,
        totalQuestions,
        percentage,
      });

      setToast(isAuto ? "Time expired! Quiz submitted automatically." : "Quiz submitted successfully!");

    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit quiz results.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = answers.filter(Boolean).length;
  const unansweredCount = (quiz?.questions?.length || 0) - answeredCount;
  const isTimeWarning = remainingSeconds <= 60 && remainingSeconds > 0;

  const minutesStr = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secondsStr = String(remainingSeconds % 60).padStart(2, "0");
  const timeFormatted = `${minutesStr}:${secondsStr}`;

  return (
    <div className="app-page quiz-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="Classroom Quiz"
          subtitle={session ? `${session.sessionName} (${sessionCode})` : "Active Quiz"}
          actions={
            !submittedResult && quiz ? (
              <span className={`quiz-timer-pill ${isTimeWarning ? "warning" : ""}`}>
                <Clock size={18} /> {timeFormatted}
              </span>
            ) : null
          }
        />

        <main className="page-shell fade-in">
          {loading && <Loading label="Preparing quiz..." />}

          {error && !loading && (
            <div className="error-state hero-card" style={{ maxWidth: "550px", margin: "2rem auto", textAlign: "center", padding: "2rem" }}>
              <strong style={{ color: "var(--danger)", fontSize: "1.2rem", display: "block", marginBottom: "0.5rem" }}>
                Quiz Unavailable
              </strong>
              <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>{error}</p>

              <div className="form-actions" style={{ justifyContent: "center", gap: "0.75rem" }}>
                {sessionCode ? (
                  <button
                    className="primary-button"
                    onClick={loadQuiz}
                  >
                    <RefreshCw size={16} /> Check Again
                  </button>
                ) : null}
                <button
                  className="secondary"
                  onClick={() => navigate("/student-dashboard")}
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Active Quiz View */}
          {!loading && quiz && !submittedResult && !error && (
            <>
              {/* Sticky Top Bar */}
              <div className="quiz-top-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <span className="eyebrow">Question {currentIndex + 1} of {quiz.questions.length}</span>
                    <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.1rem" }}>{quiz.title || "Classroom Assessment"}</h3>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    Progress: {answeredCount}/{quiz.questions.length} Answered
                  </span>

                  <button
                    className="primary-button"
                    onClick={() => setShowReviewModal(true)}
                    disabled={submitting}
                  >
                    <Send size={16} /> Submit Quiz
                  </button>
                </div>
              </div>

              {/* Main Quiz Layout */}
              <div className="quiz-main-layout">
                <div className="quiz-card-wrapper">
                  <div className="quiz-card-modern">
                    <div className="quiz-question-header">
                      <span className="quiz-question-tag">Question #{currentIndex + 1}</span>
                      {answers[currentIndex] ? (
                        <span className="status-pill active">
                          <CheckCircle2 size={14} /> Answered
                        </span>
                      ) : (
                        <span className="status-pill pending">
                          <HelpCircle size={14} /> Unanswered
                        </span>
                      )}
                    </div>

                    <h2 className="quiz-question-text">{quiz.questions[currentIndex]?.question}</h2>

                    <div className="quiz-options-list">
                      {quiz.questions[currentIndex]?.options.map((option, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = answers[currentIndex] === option;

                        return (
                          <div
                            key={optIdx}
                            className={`quiz-option-pill ${isSelected ? "selected" : ""}`}
                            onClick={() => selectAnswer(option)}
                          >
                            <div className="quiz-option-badge">{letter}</div>
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="form-actions" style={{ justifyContent: "space-between" }}>
                    <button
                      className="secondary"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => i - 1)}
                    >
                      <ArrowLeft size={16} /> Previous Question
                    </button>

                    {currentIndex < quiz.questions.length - 1 ? (
                      <button
                        className="primary-button"
                        onClick={() => setCurrentIndex((i) => i + 1)}
                      >
                        Next Question <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        className="primary-button"
                        onClick={() => setShowReviewModal(true)}
                        disabled={submitting}
                      >
                        Review & Submit <Send size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Side Question Palette */}
                <div className="quiz-palette-card">
                  <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem" }}>Question Palette</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Jump directly to any question.
                  </p>

                  <div className="quiz-palette-grid">
                    {quiz.questions.map((_, idx) => {
                      const isAnswered = Boolean(answers[idx]);
                      const isActive = idx === currentIndex;

                      let classNames = "quiz-palette-btn";
                      if (isAnswered) classNames += " answered";
                      if (isActive) classNames += " active";

                      return (
                        <button
                          key={idx}
                          className={classNames}
                          onClick={() => setCurrentIndex(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--success)" }}></span>
                      <span>Answered ({answeredCount})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--surface)", border: "1px solid var(--border-strong)" }}></span>
                      <span>Unanswered ({unansweredCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submitted Result View */}
          {submittedResult && (
            <section className="form-card hero-card" style={{ maxWidth: "600px", margin: "2rem auto", padding: "2.5rem", textAlign: "center" }}>
              <span className="status-pill active" style={{ fontSize: "0.9rem", padding: "0.4rem 1rem", margin: "0 auto" }}>
                <Award size={16} /> Quiz Completed
              </span>

              <h2 style={{ fontSize: "1.8rem", margin: "1rem 0 0.5rem" }}>
                {submittedResult.percentage >= 80
                  ? "Outstanding Work!"
                  : submittedResult.percentage >= 50
                  ? "Great Effort!"
                  : "Keep Reviewing!"}
              </h2>

              <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: "0 0 1.5rem" }}>
                Your response has been saved to the classroom leaderboard.
              </p>

              <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="hero-stat" style={{ textAlign: "center" }}>
                  <strong style={{ fontSize: "2rem" }}>
                    {submittedResult.score} / {submittedResult.totalQuestions}
                  </strong>
                  <span>Correct Answers</span>
                </div>
                <div className="hero-stat" style={{ textAlign: "center" }}>
                  <strong style={{ fontSize: "2rem", color: "var(--primary)" }}>
                    {submittedResult.percentage}%
                  </strong>
                  <span>Score Percentage</span>
                </div>
              </div>

              <div className="form-actions" style={{ justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <button
                  className="secondary"
                  onClick={() => setShowRevisionModal(true)}
                  style={{ background: "var(--primary-light)", color: "var(--primary)", borderColor: "var(--primary-border)" }}
                >
                  <Sparkles size={18} /> Revisit Quiz Questions
                </button>
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/leaderboard", {
                      state: { session, studentName, registerNumber },
                    })
                  }
                >
                  <Trophy size={18} /> View Class Leaderboard
                </button>
                <button
                  className="secondary"
                  onClick={() => navigate("/student-dashboard")}
                >
                  <ArrowLeft size={16} /> Back to Dashboard
                </button>
              </div>
            </section>
          )}

          {showRevisionModal && (
            <QuizRevisionModal sessionCode={sessionCode} onClose={() => setShowRevisionModal(false)} />
          )}

          {/* Submission Review Modal */}
          {showReviewModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <h2 style={{ margin: "0 0 0.5rem" }}>Confirm Quiz Submission</h2>
                <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
                  Are you ready to submit your answers? You cannot change your choices after submitting.
                </p>

                <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div className="hero-stat" style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)" }}>
                    <strong style={{ color: "var(--success)" }}>{answeredCount}</strong>
                    <span>Answered</span>
                  </div>
                  <div className="hero-stat" style={{ background: "var(--warning-bg)", border: "1px solid var(--warning-border)" }}>
                    <strong style={{ color: "var(--warning)" }}>{unansweredCount}</strong>
                    <span>Unanswered</span>
                  </div>
                </div>

                {unansweredCount > 0 && (
                  <p style={{ color: "var(--warning)", fontSize: "0.9rem", fontWeight: 600, margin: "0 0 1.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <AlertTriangle size={16} /> Note: You still have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}.
                  </p>
                )}

                <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                  <button
                    className="secondary"
                    onClick={() => setShowReviewModal(false)}
                    disabled={submitting}
                  >
                    Review Questions
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => submitQuiz(false)}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Confirm & Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default QuizPage;
