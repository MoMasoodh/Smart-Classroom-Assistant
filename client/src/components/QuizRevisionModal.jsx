import { useEffect, useState } from "react";
import api from "../services/api";
import { X, CheckCircle2, XCircle, Trophy, Sparkles, Filter, BookOpen } from "lucide-react";
import "./QuizRevisionModal.css";

function QuizRevisionModal({ sessionCode, onClose }) {
  const [revisionData, setRevisionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'correct' | 'incorrect'

  useEffect(() => {
    // Lock body scroll while modal is open
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (!sessionCode) return;

    const fetchRevision = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/results/revision/${sessionCode}`);
        setRevisionData(res.data);
      } catch (err) {
        console.error("Error loading quiz revision data:", err);
        setError(err.response?.data?.message || "Unable to load quiz revision questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchRevision();
  }, [sessionCode]);

  if (!sessionCode) return null;

  const quiz = revisionData?.quiz;
  const result = revisionData?.result;
  const questions = quiz?.questions || [];
  const savedAnswers = result?.answers || [];

  // Build combined questions list with student selections & correct answers
  const formattedQuestions = questions.map((q, idx) => {
    const savedAns = savedAnswers.find((a) => a.questionIndex === idx || a.questionText === q.question);
    const selectedOption = savedAns?.selectedOption || null;
    const isCorrect = savedAns ? savedAns.isCorrect : (selectedOption === q.correctAnswer);

    return {
      index: idx + 1,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      selectedOption,
      isCorrect,
      answered: Boolean(selectedOption),
    };
  });

  const filteredQuestions = formattedQuestions.filter((q) => {
    if (filter === "correct") return q.isCorrect;
    if (filter === "incorrect") return !q.isCorrect;
    return true;
  });

  const totalScore = result ? result.score : 0;
  const totalCount = result ? result.totalQuestions : questions.length;
  const percentage = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0;

  return (
    <div
      className="modal-backdrop fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="quiz-revision-modal hero-card">
        <div className="revision-header">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> Student Quiz Revision & Review
            </span>
            <h2 className="revision-title">
              {revisionData?.quizTitle || `Classroom Quiz — ${sessionCode}`}
            </h2>
            <p className="revision-sub">
              Review questions, correct answers, and test your subject understanding.
            </p>
          </div>

          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="Close revision modal">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="revision-loading">
            Loading quiz questions and revision details...
          </div>
        ) : error ? (
          <div className="empty-state">
            <BookOpen size={40} style={{ opacity: 0.5 }} />
            <p>{error}</p>
          </div>
        ) : (
          <div className="revision-body">
            {/* Revision Score Summary Banner */}
            <div className="revision-score-banner">
              <div className="score-summary-item">
                <span className="summary-label">Your Quiz Score</span>
                <strong className="summary-value">
                  {totalScore} / {totalCount}
                </strong>
              </div>

              <div className="score-summary-item">
                <span className="summary-label">Percentage Score</span>
                <strong className="summary-value percentage-pill">
                  {percentage}%
                </strong>
              </div>

              <div className="score-summary-item">
                <span className="summary-label">Status</span>
                <span className={`status-pill ${percentage >= 50 ? "active" : "pending"}`}>
                  <Trophy size={14} /> {percentage >= 50 ? "Passed & Reviewed" : "Needs Revision"}
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="revision-filters">
              <button
                type="button"
                className={`filter-pill ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All Questions ({formattedQuestions.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "correct" ? "active" : ""}`}
                onClick={() => setFilter("correct")}
              >
                Correct ({formattedQuestions.filter((q) => q.isCorrect).length})
              </button>
              <button
                type="button"
                className={`filter-pill ${filter === "incorrect" ? "active" : ""}`}
                onClick={() => setFilter("incorrect")}
              >
                Incorrect ({formattedQuestions.filter((q) => !q.isCorrect).length})
              </button>
            </div>

            {/* Question Review List */}
            <div className="revision-questions-list">
              {filteredQuestions.length === 0 ? (
                <div className="empty-state">No questions in this filter view.</div>
              ) : (
                filteredQuestions.map((q) => (
                  <div key={q.index} className={`revision-q-card ${q.isCorrect ? "card-correct" : "card-incorrect"}`}>
                    <div className="q-card-header">
                      <span className="q-number">Question #{q.index}</span>
                      <span className={`q-status-tag ${q.isCorrect ? "tag-success" : "tag-danger"}`}>
                        {q.isCorrect ? (
                          <>
                            <CheckCircle2 size={15} /> Correct Answer
                          </>
                        ) : (
                          <>
                            <XCircle size={15} /> Incorrect / Review Needed
                          </>
                        )}
                      </span>
                    </div>

                    <h4 className="q-text">{q.question}</h4>

                    <div className="q-options-grid">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOption = opt === q.correctAnswer;
                        const isSelectedOption = opt === q.selectedOption;

                        let optClass = "option-item";
                        if (isCorrectOption) optClass += " opt-correct";
                        if (isSelectedOption && !isCorrectOption) optClass += " opt-wrong-selected";

                        return (
                          <div key={oIdx} className={optClass}>
                            <div className="opt-radio-icon">
                              {isCorrectOption ? (
                                <CheckCircle2 size={16} color="#10b981" />
                              ) : isSelectedOption ? (
                                <XCircle size={16} color="#ef4444" />
                              ) : (
                                <span className="opt-bullet"></span>
                              )}
                            </div>
                            <span className="opt-text">{opt}</span>
                            {isCorrectOption && <span className="opt-badge-tag correct-badge">Correct Choice</span>}
                            {isSelectedOption && !isCorrectOption && (
                              <span className="opt-badge-tag selected-badge">Your Selection</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizRevisionModal;
