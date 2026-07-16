import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import { getStoredSessions } from "../services/storage";
import "./TeacherDashboard.css";

function TeacherDashboard() {

    const navigate = useNavigate();
    const location = useLocation();

    const teacherName = location.state?.teacherName || "Teacher";
    const sessions = getStoredSessions();
    const activeSessions = sessions.filter((session) => session.isActive !== false);
    const latestSession = sessions[0];

    const openLatestSession = () => {
        if (!latestSession) {
            navigate("/my-sessions");
            return;
        }

        navigate("/manage-session", {
            state: {
                session: latestSession,
            },
        });
    };

    return (

        <div className="app-page">

            <Sidebar teacher />

            <div className="content-with-sidebar">

                <Header
                    title="Teacher Dashboard"
                    subtitle={`Welcome back, ${teacherName}`}
                    actions={
                        <button
                            className="primary-button"
                            onClick={() => navigate("/create-session")}
                        >
                            Create Session
                        </button>
                    }
                />

                <main className="page-shell">

                    <section className="hero-card page-hero">
                        <div>
                            <span className="eyebrow">Teaching overview</span>
                            <h2 style={{ margin: "0.75rem 0 0.35rem" }}>Manage sessions, doubts, and quizzes from one place.</h2>
                            <p style={{ margin: 0, color: "var(--muted)" }}>
                                Keep your classroom flow moving with quick access to the current session, pending doubts, quiz publishing, and analytics.
                            </p>
                        </div>

                        <div className="field-grid">
                            <div className="hero-stat">
                                <strong>{sessions.length}</strong>
                                <span>Total sessions saved in this browser</span>
                            </div>
                            <div className="hero-stat">
                                <strong>{activeSessions.length}</strong>
                                <span>Active sessions</span>
                            </div>
                        </div>
                    </section>

                    <div className="dashboard-grid">
                        <DashboardCard
                            icon="➕"
                            title="Create Session"
                            description="Create a new classroom session and generate the QR code instantly."
                            onClick={() => navigate("/create-session")}
                        />

                        <DashboardCard
                            icon="📚"
                            title="My Sessions"
                            description="View every saved session, open one for management, or close it."
                            onClick={() => navigate("/my-sessions")}
                            footer={<span className="status-pill active">{sessions.length} saved</span>}
                        />

                        <DashboardCard
                            icon="🧭"
                            title="Manage Latest Session"
                            description="Jump directly into the most recently created classroom session."
                            onClick={openLatestSession}
                            footer={latestSession ? <span className="status-pill active">{latestSession.sessionCode}</span> : <span className="status-pill pending">No session yet</span>}
                        />

                        <DashboardCard
                            icon="📝"
                            title="Pending Doubts"
                            description="Review and answer unresolved student doubts from your active session."
                            onClick={() => navigate("/pending-doubts")}
                        />

                        <DashboardCard
                            icon="📊"
                            title="Statistics"
                            description="Review live classroom analytics for students, doubts, and quiz attempts."
                            onClick={() => navigate("/statistics")}
                        />

                        <DashboardCard
                            icon="🚪"
                            title="Logout"
                            description="Return to the home page and switch accounts if needed."
                            onClick={() => navigate("/")}
                        />
                    </div>

                </main>

            </div>

        </div>

    );

}

export default TeacherDashboard;