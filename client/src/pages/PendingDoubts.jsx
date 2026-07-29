import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DoubtCard from "../components/DoubtCard";
import { SkeletonCard } from "../components/Skeleton";
import { HelpCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import "./PendingDoubts.css";

function PendingDoubts() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session || null;
  const teacherView = true;

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?._id) {
      setLoading(false);
      setError("No classroom session selected.");
      return;
    }

    fetchPendingDoubts();
  }, [session?._id]);

  const fetchPendingDoubts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/sessions/my-sessions/${session._id}/pending`
      );

      setDoubts(response.data);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to load pending doubts.");
    } finally {
      setLoading(false);
    }
  };

  const answerDoubt = (doubt) => {
    navigate("/answer-doubt", {
      state: {
        doubt,
        session,
        teacherView: true,
      },
    });
  };

  return (
    <div className="app-page">
      <Sidebar teacher={teacherView} />

      <div className="content-with-sidebar">
        <Header
          title="Pending Doubts Queue"
          subtitle={
            session
              ? `${session.sessionName} • PIN ${session.sessionCode}`
              : "Teacher Review Queue"
          }
          actions={
            <button
              className="secondary"
              onClick={() => navigate("/manage-session", { state: { session } })}
            >
              <ArrowLeft size={16} /> Back to Session
            </button>
          }
        />

        <main className="page-shell fade-in">
          {loading && (
            <div className="dashboard-grid">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {error && !loading ? (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Unable to load pending doubts</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          ) : null}

          {!loading && !error && doubts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={48} style={{ color: "var(--success)" }} />
              <strong>All Doubts Answered!</strong>
              <p>Great job! There are no pending questions from students in this session.</p>
            </div>
          ) : null}

          <div className="dashboard-grid">
            {doubts.map((doubt) => (
              <DoubtCard
                key={doubt._id}
                doubt={doubt}
                onAnswer={() => answerDoubt(doubt)}
                onAiAnswer={() =>
                  navigate("/answer-doubt", {
                    state: { doubt, session, mode: "ai" },
                  })
                }
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PendingDoubts;