import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateSession.css";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { saveStoredSession, setActiveSession } from "../services/storage";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  PlusCircle,
  BookOpen,
  QrCode,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Calendar,
} from "lucide-react";

function CreateSession() {
  const navigate = useNavigate();
  const { teacher } = useAuth();
  const { addToast } = useToast();

  const [sessionName, setSessionName] = useState("");
  const [subject, setSubject] = useState("");
  const [expiryOption, setExpiryOption] = useState("60");
  const [customDateTime, setCustomDateTime] = useState("");

  const [createdSession, setCreatedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const DURATION_OPTIONS = [
    { label: "15 Minutes", value: "15" },
    { label: "30 Minutes", value: "30" },
    { label: "1 Hour", value: "60" },
    { label: "2 Hours", value: "120" },
    { label: "6 Hours", value: "360" },
    { label: "12 Hours", value: "720" },
    { label: "1 Day", value: "1440" },
    { label: "2 Days", value: "2880" },
    { label: "3 Days", value: "4320" },
    { label: "1 Week", value: "10080" },
    { label: "Custom Date & Time", value: "custom" },
  ];

  const formatDurationLabel = (minutes) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 10080 === 0) return `${minutes / 10080} week${minutes / 10080 > 1 ? "s" : ""}`;
    if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes / 1440 > 1 ? "s" : ""}`;
    if (minutes % 60 === 0) return `${minutes / 60} hour${minutes / 60 > 1 ? "s" : ""}`;
    return `${minutes} min`;
  };

  const copySessionCode = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      addToast(`Session Code ${code} copied to clipboard!`, "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();

    if (!sessionName || !subject) {
      setError("Please fill in both Session Name and Subject.");
      return;
    }

    const payload = {
      sessionName,
      subject,
    };

    if (expiryOption === "custom") {
      if (!customDateTime) {
        setError("Please select a custom end Date & Time.");
        return;
      }
      const selectedDate = new Date(customDateTime);
      if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
        setError("Custom end time must be in the future.");
        return;
      }
      payload.customExpiresAt = selectedDate.toISOString();
      payload.duration = Math.max(1, Math.round((selectedDate - Date.now()) / (60 * 1000)));
    } else {
      payload.duration = Number(expiryOption);
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/sessions", payload);

      const sessionData = {
        ...response.data,
        teacherId: teacher.id,
        teacherName: teacher.fullName,
      };

      setCreatedSession(sessionData);
      saveStoredSession(sessionData);
      setActiveSession(sessionData);
      setToast("Session Created");
      addToast(`Classroom Session "${sessionName}" created successfully!`, "success");

      setSessionName("");
      setSubject("");
      setExpiryOption("60");
      setCustomDateTime("");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Unable to create session.");
      addToast(error.response?.data?.message || "Unable to create session.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="Create Classroom Session"
          subtitle="Launch a new session, generate shareable QR code and PIN."
          actions={
            <button className="secondary" onClick={() => navigate("/my-sessions")}>
              <BookOpen size={16} /> View My Sessions
            </button>
          }
        />

        <main className="page-shell page-grid fade-in">
          <section className="form-card hero-card" style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div className="page-hero" style={{ marginBottom: "1.5rem" }}>
              <div>
                <span className="eyebrow">
                  <Sparkles size={14} /> Instant Classroom Launch
                </span>
                <h2 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.5rem" }}>
                  Launch a new classroom session in seconds.
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  The server automatically generates a unique 6-character PIN and high-resolution QR code.
                </p>
              </div>
            </div>

            <form onSubmit={createSession} style={{ display: "grid", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Classroom / Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms - Lecture 4"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Subject / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Session Expiration Duration</label>
                <select
                  value={expiryOption}
                  onChange={(e) => setExpiryOption(e.target.value)}
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Expiry Duration: {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {expiryOption === "custom" && (
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Calendar size={16} /> Select Custom Expiry Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => setCustomDateTime(e.target.value)}
                  />
                </div>
              )}

              {error ? <p className="error-text">{error}</p> : null}

              <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                <button className="primary-button" type="submit" disabled={loading} style={{ width: "100%", padding: "0.9rem" }}>
                  {loading ? (
                    "Generating Session..."
                  ) : (
                    <>
                      <PlusCircle size={18} /> Launch Classroom Session
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {loading ? <Loading label="Generating classroom session and QR code..." /> : null}

          {createdSession ? (
            <section className="form-card hero-card" style={{ maxWidth: "720px", margin: "1.5rem auto", textAlign: "center" }}>
              <span className="status-pill active" style={{ margin: "0 auto 1rem", fontSize: "0.9rem", padding: "0.35rem 1rem" }}>
                <CheckCircle2 size={16} /> Session Created & Live
              </span>
              <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.6rem" }}>{createdSession.sessionName}</h2>
              <p style={{ margin: "0 0 1.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>
                Subject: <strong>{createdSession.subject}</strong>
              </p>

              <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="hero-stat" style={{ background: "var(--primary-light)", border: "1px solid var(--primary-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <strong style={{ fontSize: "1.8rem", color: "var(--primary)", fontFamily: "monospace" }}>
                      {createdSession.sessionCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copySessionCode(createdSession.sessionCode)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--primary)", padding: "0.2rem" }}
                      title="Copy Session PIN"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--primary)" }}>Classroom PIN Code</span>
                </div>

                <div className="hero-stat">
                  <strong style={{ fontSize: "1.4rem" }}>
                    {formatDurationLabel(createdSession.duration)}
                  </strong>
                  <span style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                    <Clock size={14} /> Expires: {new Date(createdSession.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {createdSession.qrCode && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <img
                    src={createdSession.qrCode}
                    alt="Session QR Code"
                    style={{ width: "220px", height: "220px", borderRadius: "16px", border: "1px solid var(--border)", background: "white", padding: "0.75rem", boxShadow: "var(--shadow-md)" }}
                  />
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Display this QR Code on your projector screen for students to scan.
                  </p>
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: "center" }}>
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/manage-session", {
                      state: { session: createdSession },
                    })
                  }
                >
                  Manage Live Session <ArrowRight size={16} />
                </button>
                <button className="secondary" onClick={() => navigate("/my-sessions")}>
                  <BookOpen size={16} /> View All Sessions
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <Toast message={toast} type="success" />
    </div>
  );
}

export default CreateSession;