import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import VoiceRecorder from "../components/VoiceRecorder";
import VoicePlayer from "../components/VoicePlayer";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Sparkles, Save, ArrowLeft, Bot, HelpCircle, Mic, FileText } from "lucide-react";

function AnswerDoubt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacher } = useAuth();
  const { addToast } = useToast();

  const session = location.state?.session || null;
  const doubt = location.state?.doubt;
  const autoGenerate = location.state?.mode === "ai";
  const teacherView = Boolean(location.state?.teacherView || teacher);

  const [answerMode, setAnswerMode] = useState("text"); // 'text' | 'voice'
  const [answer, setAnswer] = useState(doubt?.answer || "");
  const [voiceAnswerData, setVoiceAnswerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const questionPrompt = doubt?.type === "voice" ? (doubt?.transcription || doubt?.question) : doubt?.question;

  useEffect(() => {
    if (autoGenerate && questionPrompt) {
      generateAIAnswer();
    }
  }, [autoGenerate, questionPrompt]);

  const generateAIAnswer = async () => {
    if (!questionPrompt) return;
    try {
      setLoading(true);
      setError("");
      const response = await api.post("/ai/generate-answer", {
        question: questionPrompt,
      });
      setAnswer(response.data.answer || "");
      setToast("AI Answer Generated");
      addToast("AI Answer generated successfully using Gemini!", "success");
    } catch (requestError) {
      const msg =
        requestError.response?.data?.message ||
        "Unable to generate AI answer.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (event) => {
    event.preventDefault();

    if (answerMode === "text" && !answer.trim()) {
      setError("Please enter an answer before saving.");
      return;
    }

    if (answerMode === "voice" && !voiceAnswerData?.blob) {
      setError("Please record your voice answer before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (answerMode === "voice") {
        const formData = new FormData();
        formData.append("audio", voiceAnswerData.blob, "teacher-voice-answer.webm");
        if (answer) formData.append("answer", answer);

        await api.put(`/doubts/${doubt._id}/voice-answer`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/doubts/${doubt._id}`, { answer });
      }

      setToast("Answer Saved");
      addToast("Answer posted and saved to classroom discussion!", "success");
      navigate("/pending-doubts", { state: { session, teacherView } });
    } catch (requestError) {
      const msg =
        requestError.response?.data?.message || "Unable to save answer.";
      setError(msg);
      addToast(msg, "error");
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
          <main className="page-shell fade-in">
            <div className="empty-state">
              <HelpCircle size={48} />
              <strong>No doubt selected.</strong>
              <p>Please select a pending doubt from the queue first.</p>
              <button
                className="primary-button"
                onClick={() => navigate("/pending-doubts", { state: { session, teacherView } })}
              >
                <ArrowLeft size={16} /> Return to Pending Doubts
              </button>
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
          title="Answer Student Doubt"
          subtitle={`${doubt.studentName} (${doubt.registerNumber || "Reg No N/A"}) • Subject: ${doubt.subject}`}
          actions={
            <button
              className="secondary"
              onClick={() => navigate("/pending-doubts", { state: { session, teacherView } })}
            >
              <ArrowLeft size={16} /> Back to Pending Queue
            </button>
          }
        />

        <main className="page-shell page-grid fade-in">
          <section className="form-card hero-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="hero-card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span className="status-pill pending">Pending Explanation</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <h3 style={{ margin: "0.4rem 0 0.2rem", fontSize: "1.25rem" }}>
                {doubt.studentName} {doubt.registerNumber ? `(${doubt.registerNumber})` : ""}
              </h3>
              <p style={{ margin: "0 0 1rem", color: "var(--primary)", fontWeight: 600 }}>Subject: {doubt.subject}</p>
              
              {doubt.type === "voice" ? (
                <div style={{ background: "var(--surface-alt)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    <Mic size={16} /> Student Voice Recording:
                  </div>
                  {doubt.audioUrl && (
                    <VoicePlayer
                      src={doubt.audioUrl}
                      duration={doubt.audioDuration}
                      title="Student Voice Question"
                    />
                  )}
                  {doubt.transcription && doubt.transcription !== "Voice Doubt Recording" && (
                    <p style={{ marginTop: "0.5rem", fontStyle: "italic", color: "var(--text)" }}>
                      Transcription: "{doubt.transcription}"
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    fontSize: "1.05rem",
                    lineHeight: 1.6,
                  }}
                >
                  "{doubt.question}"
                </div>
              )}
            </div>

            <div className="filter-pill-group" style={{ marginBottom: "1rem", justifyContent: "flex-start" }}>
              <button
                type="button"
                className={`filter-pill ${answerMode === "text" ? "active" : ""}`}
                onClick={() => setAnswerMode("text")}
              >
                <FileText size={16} /> Text Answer
              </button>
              <button
                type="button"
                className={`filter-pill ${answerMode === "voice" ? "active" : ""}`}
                onClick={() => setAnswerMode("voice")}
              >
                <Mic size={16} /> 🎤 Voice Answer
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <label style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                Teacher Response
              </label>
              <button
                type="button"
                className="button secondary"
                onClick={generateAIAnswer}
                disabled={loading}
                style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid rgba(139, 92, 246, 0.3)" }}
              >
                <Bot size={16} /> {loading ? "Generating..." : "Generate Gemini AI Answer"}
              </button>
            </div>

            {loading ? <Loading label="Consulting Gemini AI model for explanation..." /> : null}

            <form onSubmit={saveAnswer} style={{ display: "grid", gap: "1.25rem" }}>
              {answerMode === "text" ? (
                <textarea
                  rows="7"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write your explanation here or generate an AI response above..."
                />
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  <VoiceRecorder
                    onRecordComplete={(data) => setVoiceAnswerData(data)}
                    onClear={() => setVoiceAnswerData(null)}
                  />
                  <textarea
                    rows="3"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Optional text notes to accompany your voice answer..."
                  />
                </div>
              )}

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate("/pending-doubts", { state: { session, teacherView } })}
                >
                  <ArrowLeft size={16} /> Cancel
                </button>
                <button className="primary-button" type="submit" disabled={saving}>
                  <Save size={16} /> {saving ? "Saving Answer..." : `Publish & Save ${answerMode === "voice" ? "Voice" : "Text"} Answer`}
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