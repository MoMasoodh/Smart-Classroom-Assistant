import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function AnswerDoubt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacher } = useAuth();

  const session = location.state?.session || null;
  const doubt = location.state?.doubt;
  const autoGenerate = location.state?.mode === "ai";
  const teacherView = Boolean(location.state?.teacherView || teacher);

  const [answer, setAnswer] = useState(doubt?.answer || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (autoGenerate && doubt?.question) {
      generateAIAnswer();
    }
  }, [autoGenerate, doubt?.question]);

  const generateAIAnswer = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.post("/ai/generate-answer", { question: doubt.question });
      setAnswer(response.data.answer || "");
      setToast("AI Answer Generated");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate AI answer.");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (event) => {
    event.preventDefault();

    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.put(`/doubts/${doubt._id}`, { answer });
      setToast("Answer Saved");
      navigate("/pending-doubts", { state: { session, teacherView } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save answer.");
    } finally {
      setSaving(false);
    }
  };

  if (!doubt) {
    return (
      <div className="app-page">
        <Sidebar teacher />
        <div className="content-with-sidebar">
          <Header title="Answer Doubt" subtitle="No doubt selected" />
          <main className="page-shell">
            <div className="empty-state">
              <strong>No doubt selected.</strong>
              <p>Open a pending doubt from the teacher dashboard first.</p>
              <button className="primary-button" onClick={() => navigate("/pending-doubts", { state: { session, teacherView } })}>Pending Doubts</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Sidebar teacher={teacherView} />
      <div className="content-with-sidebar">
        <Header
          title="Answer Doubt"
          subtitle={`${doubt.studentName} · ${doubt.subject}`}
          actions={<button className="secondary" onClick={() => navigate("/pending-doubts", { state: { session, teacherView } })}>Back to Pending</button>}
        />

        <main className="page-shell page-grid">
          {loading ? <Loading label="Generating AI answer" /> : null}

          <section className="form-card page-section">
            <div className="hero-card">
              <span className="status-pill pending">Pending</span>
              <h3 style={{ margin: "0.7rem 0 0.35rem" }}>{doubt.studentName}</h3>
              <p style={{ margin: 0, color: "var(--muted)" }}>{doubt.subject}</p>
              <p style={{ marginTop: "1rem" }}>{doubt.question}</p>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={generateAIAnswer} disabled={loading}>
                {loading ? "Generating..." : "AI Answer"}
              </button>
            </div>

            <form onSubmit={saveAnswer} className="page-section">
              <textarea rows="8" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write your answer here" />

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Answer"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default AnswerDoubt;