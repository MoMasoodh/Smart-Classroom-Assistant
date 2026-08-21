import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import VoiceRecorder from "../components/VoiceRecorder";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";
import { useToast } from "../contexts/ToastContext";
import { HelpCircle, Send, ArrowLeft, Sparkles, Mic, FileText } from "lucide-react";
import "./AskDoubt.css";

import { useStudentSessionSocket } from "../hooks/useStudentSessionSocket";

function AskDoubt() {
  useStudentSessionSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const student = getStudent();

  const [doubtType, setDoubtType] = useState("text"); // 'text' | 'voice'
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const profile = getStudentProfile();
  const studentName = location.state?.studentName || profile?.studentName || student?.student?.fullName || "Student";
  const registerNumber = location.state?.registerNumber || profile?.registerNumber || student?.student?.registerNumber || "";
  const session = location.state?.session || profile?.session || getActiveSession();
  const sessionCode = session?.sessionCode || "";

  const submitDoubt = async (e) => {
    e.preventDefault();

    if (!subject) {
      setError("Please specify the Subject / Topic.");
      return;
    }

    if (doubtType === "text" && !question.trim()) {
      setError("Please type your detailed question.");
      return;
    }

    if (doubtType === "voice" && !audioData?.blob) {
      setError("Please record your voice question before submitting.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (doubtType === "voice") {
        const mimeType = audioData.mimeType || audioData.blob.type || "audio/webm";
        const ext = mimeType.includes("mp4") ? ".mp4" : mimeType.includes("ogg") ? ".ogg" : ".webm";
        const filename = `voice-doubt-${Date.now()}${ext}`;

        const formData = new FormData();
        formData.append("audio", audioData.blob, filename);
        formData.append("studentId", student.student.id || student.student._id || "");
        formData.append("studentName", student.student.fullName);
        formData.append("registerNumber", student.student.registerNumber);
        formData.append("sessionCode", sessionCode);
        formData.append("subject", subject);
        formData.append("transcription", audioData.transcription || "Voice Doubt Recording");
        formData.append("audioDuration", audioData.duration || 0);
        formData.append("audioMimeType", mimeType);

        await api.post("/doubts/voice", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/doubts", {
          studentId: student.student.id || student.student._id || "",
          studentName: student.student.fullName,
          registerNumber: student.student.registerNumber,
          sessionCode,
          subject,
          question,
        });
      }

      setToast("Doubt Submitted");
      addToast("Doubt submitted to teacher successfully!", "success");

      navigate("/my-doubts", {
        state: {
          studentName,
          registerNumber,
          session,
        },
      });
    } catch (error) {
      console.log(error);
      const msg = error.response?.data?.message || "Unable to submit doubt.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="Ask Classroom Doubt"
          subtitle={session ? `Session PIN ${session.sessionCode} • ${studentName}` : studentName}
          actions={
            <button
              className="secondary"
              onClick={() => navigate("/student-dashboard", { state: { studentName, registerNumber, session } })}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          }
        />

        <main className="page-shell fade-in">
          <section className="form-card hero-card" style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div className="page-hero" style={{ marginBottom: "1.5rem" }}>
              <span className="eyebrow">
                <Sparkles size={14} /> Real-Time Question
              </span>
              <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.4rem" }}>
                Ask your question directly to the teacher.
              </h2>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Your question will appear instantly on the teacher's dashboard queue.
              </p>
            </div>

            <div className="filter-pill-group" style={{ marginBottom: "1.5rem", justifyContent: "center" }}>
              <button
                type="button"
                className={`filter-pill ${doubtType === "text" ? "active" : ""}`}
                onClick={() => setDoubtType("text")}
              >
                <FileText size={16} /> Text Question
              </button>
              <button
                type="button"
                className={`filter-pill ${doubtType === "voice" ? "active" : ""}`}
                onClick={() => setDoubtType("voice")}
              >
                <Mic size={16} /> 🎤 Record Voice Doubt
              </button>
            </div>

            <form onSubmit={submitDoubt} style={{ display: "grid", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Subject / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures / Binary Search Trees"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {doubtType === "text" ? (
                <div className="form-group">
                  <label>Detailed Question</label>
                  <textarea
                    rows="6"
                    placeholder="Type your question or doubt clearly..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Voice Doubt Recording</label>
                  <VoiceRecorder
                    onRecordComplete={(data) => setAudioData(data)}
                    onClear={() => setAudioData(null)}
                  />
                </div>
              )}

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate("/student-dashboard", { state: { studentName, registerNumber, session } })}
                >
                  <ArrowLeft size={16} /> Cancel
                </button>

                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send size={16} /> Submit {doubtType === "voice" ? "Voice" : "Text"} Doubt
                    </>
                  )}
                </button>
              </div>
            </form>

            {loading ? <Loading label="Sending doubt to teacher queue..." /> : null}
          </section>
        </main>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default AskDoubt;