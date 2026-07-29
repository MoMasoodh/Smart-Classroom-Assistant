import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionCard from "../components/SessionCard";
import { SkeletonCard } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { PlusCircle, BookOpen, Search } from "lucide-react";

function MySessions() {
  const navigate = useNavigate();
  const { teacher } = useAuth();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [closingSession, setClosingSession] = useState(null);

  useEffect(() => {
    if (!teacher) {
      setLoading(false);
      setError("You are not logged in.");
      return;
    }

    const loadSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sessions/my-sessions");
        setSessions(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load sessions.");
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [teacher]);

  const openManageSession = (session) => {
    navigate("/manage-session", {
      state: { session },
    });
  };

  const handleCloseSession = async () => {
    if (!closingSession) return;

    try {
      setLoading(true);
      setError("");
      await api.put(`/sessions/${closingSession._id}/close`);
      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session._id === closingSession._id
            ? { ...session, isActive: false, closedAt: new Date().toISOString() }
            : session
        )
      );
      setToast("Session Closed");
      addToast(`Session "${closingSession.sessionName}" closed successfully.`, "info");
    } catch (requestError) {
      const msg = requestError.response?.data?.message || "Unable to close session.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
      setClosingSession(null);
    }
  };

  const sortedSessions = [...sessions].sort((left, right) => {
    const leftDate = new Date(left.savedAt || left.createdAt || 0).getTime();
    const rightDate = new Date(right.savedAt || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  });

  const filteredSessions = sortedSessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.sessionName && s.sessionName.toLowerCase().includes(term)) ||
      (s.subject && s.subject.toLowerCase().includes(term)) ||
      (s.sessionCode && s.sessionCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="app-page">
      <Sidebar teacher />

      <div className="content-with-sidebar">
        <Header
          title="My Classroom Sessions"
          subtitle="View and manage classroom sessions created by you."
          actions={
            <button className="primary-button" onClick={() => navigate("/create-session")}>
              <PlusCircle size={16} /> Create New Session
            </button>
          }
        />

        <main className="page-shell fade-in">
          {!loading && !error && sortedSessions.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
              <span className="status-pill active">
                <BookOpen size={14} /> {sortedSessions.length} Total Sessions
              </span>
              <div style={{ position: "relative", minWidth: "260px" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  type="text"
                  placeholder="Filter sessions by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "2.4rem", padding: "0.6rem 0.85rem 0.6rem 2.4rem", fontSize: "0.875rem" }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="dashboard-grid">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : null}

          {error ? (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Unable to load sessions</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          ) : null}

          {!loading && !error && sortedSessions.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <strong>You haven't created any classroom sessions yet.</strong>
              <p>Create your first session to share QR codes, manage doubts, and publish quizzes.</p>
              <button className="primary-button" onClick={() => navigate("/create-session")}>
                <PlusCircle size={16} /> Create First Session
              </button>
            </div>
          ) : null}

          <div className="dashboard-grid">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session._id || session.sessionCode}
                session={session}
                onManage={() => openManageSession(session)}
                onClose={session.isActive ? () => setClosingSession(session) : null}
              />
            ))}
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={Boolean(closingSession)}
        title="Close Classroom Session?"
        message={`Are you sure you want to close "${closingSession?.sessionName || "this session"}"? Students will no longer be able to submit doubts or attend quizzes.`}
        confirmLabel="Close Session"
        onConfirm={handleCloseSession}
        onCancel={() => setClosingSession(null)}
        danger
      />

      <Toast message={toast} type="success" />
    </div>
  );
}

export default MySessions;