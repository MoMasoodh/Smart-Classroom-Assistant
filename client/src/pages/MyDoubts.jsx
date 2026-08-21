import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DoubtCard from "../components/DoubtCard";
import { SkeletonCard } from "../components/Skeleton";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";
import { HelpCircle, PlusCircle, ArrowLeft } from "lucide-react";
import "./MyDoubts.css";

import { useStudentSessionSocket } from "../hooks/useStudentSessionSocket";

function MyDoubts() {
  useStudentSessionSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const student = getStudent();

  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedProfile = getStudentProfile();
  const studentName = location.state?.studentName || storedProfile?.studentName || student?.student?.fullName || "Student";
  const registerNumber = location.state?.registerNumber || storedProfile?.registerNumber || student?.student?.registerNumber || "";
  const session = location.state?.session || storedProfile?.session || getActiveSession();

  useEffect(() => {
    if (session?.sessionCode) {
      fetchDoubts();
    } else {
      setLoading(false);
      setError("No active session code found.");
    }
  }, [session?.sessionCode]);

  if (!student) {
    return <Navigate to="/student-login" replace />;
  }

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/doubts/session/${session.sessionCode}/my-doubts?registerNumber=${registerNumber}&studentName=${encodeURIComponent(studentName)}`
      );

      setDoubts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to load your doubts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar />

      <div className="content-with-sidebar">
        <Header
          title="My Doubts"
          subtitle={session ? `Session PIN ${session.sessionCode} • ${studentName}` : studentName}
          actions={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="primary-button"
                onClick={() => navigate("/ask-doubt", { state: { studentName, registerNumber, session } })}
              >
                <PlusCircle size={16} /> Ask Question
              </button>
              <button
                className="secondary"
                onClick={() => navigate("/student-dashboard", { state: { studentName, registerNumber, session } })}
              >
                <ArrowLeft size={16} /> Dashboard
              </button>
            </div>
          }
        />

        <main className="page-shell fade-in">
          {loading && (
            <div className="page-grid">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {error && !loading ? (
            <div className="error-state hero-card">
              <strong style={{ fontSize: "1.1rem" }}>Unable to load doubts</strong>
              <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
            </div>
          ) : null}

          {!loading && !error && doubts.length === 0 ? (
            <div className="empty-state">
              <HelpCircle size={48} />
              <strong>No doubts submitted yet.</strong>
              <p>Ask a question to see teacher answers and AI explanations here.</p>
              <button
                className="primary-button"
                onClick={() => navigate("/ask-doubt", { state: { studentName, registerNumber, session } })}
              >
                <PlusCircle size={16} /> Ask Your First Question
              </button>
            </div>
          ) : null}

          <div className="page-grid">
            {doubts.map((doubt) => (
              <DoubtCard key={doubt._id} doubt={doubt} readOnly />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MyDoubts;