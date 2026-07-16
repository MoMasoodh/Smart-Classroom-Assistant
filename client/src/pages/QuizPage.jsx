import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import QuizCard from "../components/QuizCard";
import api from "../services/api";
import { getActiveSession, getStudentProfile } from "../services/storage";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();
  const studentName = location.state?.studentName || storedProfile?.studentName || "Student";

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedResult, setSubmittedResult] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (session?.sessionCode) {
      loadQuiz();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [session?.sessionCode]);

  useEffect(() => {
    if (!quiz || submittedResult) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          submitQuiz(true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, submittedResult]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/quizzes/session/${session.sessionCode}`);
      const loadedQuiz = response.data;
      setQuiz(loadedQuiz);
      setAnswers(Array(loadedQuiz.questions.length).fill(""));
      setRemainingSeconds(Number(loadedQuiz.duration || 0) * 60);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Quiz unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (option) => {
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[currentIndex] = option;
      return nextAnswers;
    });
  };

  const submitQuiz = async (isAuto = false) => {
    if (!quiz || submitting || submittedResult) {
      return;
    }

    try {
      setSubmitting(true);
      const score = quiz.questions.reduce((total, question, index) => {
        return total + (answers[index] === question.correctAnswer ? 1 : 0);
      }, 0);

      const response = await api.post("/results", {
        sessionCode: session.sessionCode,
        studentName,
        score,
        totalQuestions: quiz.questions.length,
      });

      setSubmittedResult({ ...response.data, score, totalQuestions: quiz.questions.length });
      setToast(isAuto ? "Quiz submitted automatically" : "Quiz submitted");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="app-page">

      <Sidebar />

      <div className="content-with-sidebar">

        <Header
          title="Quiz"
          subtitle={session ? `Session ${session.sessionCode} · ${studentName}` : studentName}
          actions={
            <span className="status-pill active">{formattedTime}</span>
          }
        />

        <main className="page-shell page-grid">

          {loading ? <Loading label="Loading quiz" /> : null}

          {error ? (
            <div className="error-state">
              <strong>Quiz unavailable</strong>
              <p>{error}</p>
              <button className="primary-button" onClick={() => navigate("/student-dashboard", { state: { studentName, session } })}>
                Back to Dashboard
              </button>
            </div>
          ) : null}

          {!loading && !error && quiz && !submittedResult ? (
            <>
              <section className="hero-card page-hero">
                <div>
                  <span className="eyebrow">Active quiz</span>
                  <h2 style={{ margin: "0.75rem 0 0.35rem" }}>{quiz.title}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Answer the questions before the timer reaches zero.
                  </p>
                </div>

                <div className="field-grid">
                  <div className="hero-stat">
                    <strong>{quiz.questions.length}</strong>
                    <span>Total questions</span>
                  </div>
                  <div className="hero-stat">
                    <strong>{formattedTime}</strong>
                    <span>Remaining time</span>
                  </div>
                </div>
              </section>

              <QuizCard
                question={quiz.questions[currentIndex]}
                index={currentIndex}
                total={quiz.questions.length}
                selectedAnswer={answers[currentIndex]}
                onSelect={selectAnswer}
              />

              <div className="form-actions">
                <button className="secondary" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}>
                  Previous
                </button>

                {currentIndex < quiz.questions.length - 1 ? (
                  <button className="primary-button" type="button" onClick={() => setCurrentIndex((index) => Math.min(index + 1, quiz.questions.length - 1))}>
                    Next
                  </button>
                ) : (
                  <button className="primary-button" type="button" onClick={() => submitQuiz(false)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </>
          ) : null}

          {submittedResult ? (
            <div className="success-state">
              <strong>Quiz submitted successfully</strong>
              <p>
                Score: {submittedResult.score} / {submittedResult.totalQuestions}
              </p>
              <div className="form-actions">
                <button className="primary-button" onClick={() => navigate("/leaderboard", { state: { session, studentName } })}>
                  View Leaderboard
                </button>
                <button className="secondary" onClick={() => navigate("/student-dashboard", { state: { studentName, session } })}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : null}

        </main>

      </div>

      <Toast message={toast} type="success" />

    </div>
  );
}

export default QuizPage;