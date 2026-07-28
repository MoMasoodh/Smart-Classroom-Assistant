
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import QuizCard from "../components/QuizCard";
import api from "../services/api";
import { getActiveSession, getStudentProfile, getStudent } from "../services/storage";

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const student = getStudent();
  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const storedProfile = getStudentProfile();
  const session =
    location.state?.session ||
    storedProfile?.session ||
    getActiveSession();
  const studentName = location.state?.studentName || storedProfile?.studentName || student?.student?.fullName || "Student";
  const registerNumber = location.state?.registerNumber || storedProfile?.registerNumber || student?.student?.registerNumber || "";
  const sessionCode = session?.sessionCode || "";
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState("");
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
    if (!quiz || submittedResult) return;

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
  }, [quiz, submittedResult]);

  async function loadQuiz() {
    try {
      setLoading(true);

      const sessionResponse = await api.get(
        `/sessions/${session.sessionCode}`
      );

      if (!sessionResponse.data.isActive) {
        setError("This session has been closed.");
        return;
      }

      const response = await api.get(
        `/quizzes/session/${session.sessionCode}`
      );

      setQuiz(response.data);
      setAnswers(Array(response.data.questions.length).fill(""));
      setRemainingSeconds(Number(response.data.duration || 0) * 60);
    } catch (err) {
      setError(err.response?.data?.message || "Quiz unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(option) {
    const next = [...answers];
    next[currentIndex] = option;
    setAnswers(next);
  }

  async function submitQuiz(auto = false) {
    if (!quiz || submitting || submittedResult) return;

    if (!auto) {
      if (!window.confirm("Submit Quiz?")) return;
    }

    try {
      setSubmitting(true);

      const score = quiz.questions.reduce(
        (total, q, i) =>
          total + (answers[i] === q.correctAnswer ? 1 : 0),
        0
      );

      const percentage = Math.round(
        (score / quiz.questions.length) * 100
      );
      const totalQuestions = quiz.questions.length;

    await api.post("/results", {
    sessionCode,
    studentName: student.student.fullName,
    registerNumber: student.student.registerNumber,
    score,
    totalQuestions,
});
      setSubmittedResult({
        score,
        totalQuestions,
        percentage,
      });

      setToast(auto ? "Quiz auto submitted" : "Quiz submitted");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  const answered = answers.filter(Boolean).length;

  const time =
    String(Math.floor(remainingSeconds / 60)).padStart(2, "0") +
    ":" +
    String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="app-page">
      <Sidebar />
      <div className="content-with-sidebar">
        <Header
          title="Quiz"
          subtitle={session?.sessionCode || ""}
          actions={<span className="status-pill active">{time}</span>}
        />

        <main className="page-shell page-grid">
          {loading && <Loading label="Loading quiz" />}

          {error && (
            <div className="error-state">
              <strong>Quiz unavailable</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && quiz && !submittedResult && (
            <>
              <section className="hero-card page-hero">
                <div className="field-grid">
                  <div className="hero-stat">
                    <strong>{currentIndex + 1}/{quiz.questions.length}</strong>
                    <span>Progress</span>
                  </div>

                  <div className="hero-stat">
                    <strong>{answered}</strong>
                    <span>Answered</span>
                  </div>

                  <div className="hero-stat">
                    <strong>{time}</strong>
                    <span>Time Left</span>
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
                <button
                  className="secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  Previous
                </button>

                {currentIndex < quiz.questions.length - 1 ? (
                  <button
                    className="primary-button"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    disabled={submitting}
                    onClick={() => submitQuiz(false)}
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                )}
              </div>
            </>
          )}

          {submittedResult && (
            <div className="success-state">
              <h2>
                {submittedResult.percentage >= 70
                  ? "🎉 Excellent"
                  : submittedResult.percentage >= 40
                  ? "👍 Good"
                  : "📚 Keep Practicing"}
              </h2>

              <p>
                Score: {submittedResult.score}/
                {submittedResult.totalQuestions}
              </p>

              <p>Percentage: {submittedResult.percentage}%</p>

              <div className="form-actions">
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/leaderboard", {
                      state: { session, studentName, registerNumber },
                    })
                  }
                >
                  View Leaderboard
                </button>
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
