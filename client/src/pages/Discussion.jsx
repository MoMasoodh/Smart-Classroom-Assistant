import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import DoubtCard from "../components/DoubtCard";
import api from "../services/api";
import { getActiveSession, getStudentProfile } from "../services/storage";

function Discussion() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedProfile = getStudentProfile();
  const session = location.state?.session || storedProfile?.session || getActiveSession();

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.sessionCode) {
      loadDiscussion();
    } else {
      setLoading(false);
      setError("Session not found.");
    }
  }, [session?.sessionCode]);

  const loadDiscussion = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/doubts/session/${session.sessionCode}/answered`);
      const sorted = [...response.data].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
      setDoubts(sorted);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load discussion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar />
      <div className="content-with-sidebar">
        <Header
          title="Discussion"
          subtitle={session ? `Answered doubts · Session ${session.sessionCode}` : "Answered classroom doubts"}
          actions={
            <button className="secondary" onClick={() => navigate("/student-dashboard", { state: { studentName: storedProfile?.studentName, session } })}>
              Back to Dashboard
            </button>
          }
        />

        <main className="page-shell page-grid">
          {loading ? <Loading label="Loading discussion" /> : null}

          {error ? (
            <div className="error-state">
              <strong>Discussion unavailable</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && !error && doubts.length === 0 ? (
            <div className="empty-state">
              <strong>No answered doubts yet.</strong>
              <p>When the teacher answers doubts, they will appear here newest first.</p>
            </div>
          ) : null}

          <div className="card-grid">
            {doubts.map((doubt) => (
              <DoubtCard key={doubt._id} doubt={doubt} readOnly />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Discussion;