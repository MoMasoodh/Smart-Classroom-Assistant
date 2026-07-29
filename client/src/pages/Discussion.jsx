import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DoubtCard from "../components/DoubtCard";
import { SkeletonCard } from "../components/Skeleton";
import api from "../services/api";
import { getActiveSession, getStudentProfile, getStudent } from "../services/storage";
import { MessageSquare, Search, ArrowLeft } from "lucide-react";

function Discussion() {
  const navigate = useNavigate();
  const location = useLocation();
  const student = getStudent();

  const [doubts, setDoubts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedProfile = getStudentProfile();
  const studentName = location.state?.studentName || storedProfile?.studentName || student?.student?.fullName || "Student";
  const registerNumber = location.state?.registerNumber || storedProfile?.registerNumber || student?.student?.registerNumber || "";
  const session = location.state?.session || storedProfile?.session || getActiveSession();
  const teacherView = Boolean(location.state?.teacherView);

  useEffect(() => {
    if (session?.sessionCode) {
      loadDiscussion();
    } else {
      setLoading(false);
      setError("No active classroom session found.");
    }
  }, [session?.sessionCode]);

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const loadDiscussion = async () => {
    try {
      setLoading(true);
      setError("");
      const response = teacherView && session?._id
        ? await api.get(`/sessions/my-sessions/${session._id}/answered`)
        : await api.get(`/doubts/session/${session.sessionCode}/answered`);
      const sorted = [...response.data].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
      setDoubts(sorted);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load discussion stream.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      (d.question && d.question.toLowerCase().includes(term)) ||
      (d.subject && d.subject.toLowerCase().includes(term)) ||
      (d.studentName && d.studentName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="app-page">
      <Sidebar teacher={teacherView} />
      <div className="content-with-sidebar">
        <Header
          title="Classroom Discussion"
          subtitle={session ? `Answered Doubts • Session PIN ${session.sessionCode}` : "Answered Doubts Stream"}
          actions={
            teacherView ? (
              <button className="secondary" onClick={() => navigate("/manage-session", { state: { session } })}>
                <ArrowLeft size={16} /> Back to Session
              </button>
            ) : (
              <button className="secondary" onClick={() => navigate("/student-dashboard", { state: { studentName, registerNumber, session } })}>
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            )
          }
        />

        <main className="page-shell fade-in">
          {/* Search bar header */}
          {!loading && !error && doubts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
              <span className="status-pill active" style={{ fontSize: "0.85rem" }}>
                <MessageSquare size={14} /> {doubts.length} Resolved Doubts
              </span>
              <div style={{ position: "relative", minWidth: "260px" }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
                <input
                  type="text"
                  placeholder="Filter discussion by topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "2.4rem", padding: "0.6rem 0.85rem 0.6rem 2.4rem", fontSize: "0.875rem" }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="page-grid">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : null}

          {error ? (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Discussion Unavailable</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          ) : null}

          {!loading && !error && doubts.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={48} />
              <strong>No Answered Doubts Yet</strong>
              <p>When the teacher answers student questions, explanations will appear here live.</p>
            </div>
          ) : null}

          <div className="page-grid">
            {filteredDoubts.map((doubt) => (
              <DoubtCard key={doubt._id} doubt={doubt} readOnly />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Discussion;