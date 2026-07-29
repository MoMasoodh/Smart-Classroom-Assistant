import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";
import { useToast } from "../contexts/ToastContext";
import { HelpCircle, Send, ArrowLeft, Sparkles } from "lucide-react";
import "./AskDoubt.css";

function AskDoubt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const student = getStudent();

  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
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

    if (!subject || !question) {
      setError("Please fill in both Subject and Question.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/doubts", {
        studentName: student.student.fullName,
        registerNumber: student.student.registerNumber,
        sessionCode,
        subject,
        question,
      });

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
          <section className="form-card hero-card" style={{ maxWidth: "700px", margin: "0 auto" }}>
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

              <div className="form-group">
                <label>Detailed Question</label>
                <textarea
                  rows="6"
                  placeholder="Type your question or doubt clearly..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

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
                      <Send size={16} /> Submit Question
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