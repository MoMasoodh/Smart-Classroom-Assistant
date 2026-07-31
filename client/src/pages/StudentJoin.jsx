import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { saveStoredSession, setActiveSession, setStudentProfile, getStudent } from "../services/storage";
import { useToast } from "../contexts/ToastContext";
import { QrCode, LogIn, GraduationCap, AlertCircle } from "lucide-react";
import "./StudentJoin.css";

function StudentJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { addToast } = useToast();

  const [sessionCode, setSessionCode] = useState(params.sessionCode || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const routeState = location.state;
  const loggedInStudent = getStudent();

  const handleJoin = async () => {
    if (!loggedInStudent) {
      setError("Please login before joining a classroom session.");
      addToast("Please login as a student first.", "warning");
      navigate("/student-login");
      return;
    }

    if (!sessionCode.trim()) {
      setError("Please enter a valid Session Code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/sessions/${sessionCode.trim().toUpperCase()}`);
      const session = response.data;

      if (!session.isActive) {
        setError("This session has been closed by the teacher.");
        addToast("This session has been closed by the teacher.", "warning");
        return;
      }

      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        setError("This session has expired.");
        addToast("This session has expired.", "warning");
        return;
      }

      setStudentProfile({
        studentName: loggedInStudent.student.fullName,
        registerNumber: loggedInStudent.student.registerNumber,
        sessionCode: session.sessionCode,
        session,
      });

      setActiveSession(session);
      saveStoredSession(session);

      // Record Attendance in Backend & Socket
      try {
        await api.post("/attendance/join", {
          sessionCode: session.sessionCode,
          studentId: loggedInStudent.student._id,
          registerNumber: loggedInStudent.student.registerNumber,
          fullName: loggedInStudent.student.fullName,
        });
      } catch (attErr) {
        console.error("Attendance record error:", attErr);
      }

      addToast(`Joined classroom session ${session.sessionCode}!`, "success");

      navigate("/student-dashboard", {
        state: {
          studentName: loggedInStudent.student.fullName,
          registerNumber: loggedInStudent.student.registerNumber,
          session,
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to join session. Check the code.";
      setError(msg);
      addToast(msg, "error");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-join-page">
      <Navbar />

      <div className="join-page fade-in">
        <div className="join-card auth-card hero-card" style={{ maxWidth: "480px", margin: "3rem auto", padding: "2.5rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <QrCode size={26} />
          </div>

          <span className="eyebrow" style={{ margin: "0 auto" }}>Classroom QR Entry</span>

          <h1 style={{ fontSize: "1.75rem", margin: "0.75rem 0 0.25rem", textAlign: "center" }}>Join Classroom</h1>

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
            Enter your teacher's 6-character session PIN to enter live classroom.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleJoin();
            }}
            style={{ display: "grid", gap: "1.25rem" }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                placeholder="Session Code (e.g. MATH101)"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                style={{
                  textAlign: "center",
                  fontSize: "1.2rem",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "0.9rem",
                }}
              />
            </div>

            {routeState?.sessionName ? (
              <div className="hero-stat" style={{ textAlign: "center" }}>
                <strong>{routeState.sessionName}</strong>
                <span>Subject: {routeState.subject}</span>
              </div>
            ) : null}

            {error ? <p className="error-text" style={{ justifyContent: "center" }}>{error}</p> : null}

            <button className="primary-button" type="submit" disabled={loading} style={{ width: "100%", padding: "0.9rem" }}>
              {loading ? (
                "Connecting..."
              ) : (
                <>
                  <LogIn size={18} /> Enter Classroom
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentJoin;