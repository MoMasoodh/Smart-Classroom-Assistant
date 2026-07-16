import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";
import { getStudentProfile, getActiveSession } from "../services/storage";

import "./StudentDashboard.css";

function StudentDashboard() {

    const navigate = useNavigate();
    const location = useLocation();

    const storedProfile = getStudentProfile();
    const studentName = location.state?.studentName || storedProfile?.studentName || "Student";
    const session = location.state?.session || storedProfile?.session || getActiveSession();

    return (

        <div className="app-page student-dashboard-page">

            <Sidebar />

            <div className="dashboard-content content-with-sidebar">

                <Header
                    title="Student Dashboard"
                    subtitle={session ? `Welcome, ${studentName} · Session ${session.sessionCode}` : `Welcome, ${studentName}`}
                    actions={
                        session ? <span className="status-pill active">{session.isActive === false ? "Closed session" : "Active session"}</span> : null
                    }
                />

                <main className="page-shell">

                    <section className="hero-card page-hero">
                        <div>
                            <span className="eyebrow">Student workspace</span>
                            <h2 style={{ margin: "0.75rem 0 0.35rem" }}>Ask questions, follow the discussion, and take quizzes.</h2>
                            <p style={{ margin: 0, color: "var(--muted)" }}>
                                Everything in the classroom stays tied to your current session so the experience remains focused and simple.
                            </p>
                        </div>

                        {session ? (
                            <div className="field-grid">
                                <div className="hero-stat">
                                    <strong>{session.sessionName}</strong>
                                    <span>{session.subject}</span>
                                </div>
                                <div className="hero-stat">
                                    <strong>{session.sessionCode}</strong>
                                    <span>Session code</span>
                                </div>
                            </div>
                        ) : null}
                    </section>

                    <div className="dashboard-grid">

                        <DashboardCard
                            icon="❓"
                            title="Ask Doubt"
                            description="Submit your doubts to the teacher."
                            onClick={() =>
                                navigate("/ask-doubt", {
                                    state: {
                                        studentName,
                                        session,
                                    }
                                })
                            }
                        />

                        <DashboardCard
                            icon="📋"
                            title="My Doubts"
                            description="View all your submitted doubts and teacher answers."
                            onClick={() =>
                                navigate("/my-doubts", {
                                    state: {
                                        studentName,
                                        session,
                                    }
                                })
                            }
                        />

                        <DashboardCard
                            icon="💬"
                            title="Discussion"
                            description="Review answered classroom doubts, newest first."
                            onClick={() =>
                                navigate("/discussion", {
                                    state: {
                                        studentName,
                                        session,
                                    }
                                })
                            }
                        />

                        <DashboardCard
                            icon="📝"
                            title="Quiz"
                            description="Attend active classroom quizzes and submit your score."
                            onClick={() =>
                                navigate("/quiz", {
                                    state: {
                                        studentName,
                                        session,
                                    }
                                })
                            }
                        />

                        <DashboardCard
                            icon="🏆"
                            title="Leaderboard"
                            description="View class rankings and celebrate the top performers."
                            onClick={() =>
                                navigate("/leaderboard", {
                                    state: {
                                        studentName,
                                        session,
                                    }
                                })
                            }
                        />

                        <DashboardCard
                            icon="🚪"
                            title="Leave Session"
                            description="Return to the home page."
                            onClick={() => navigate("/")}
                        />

                    </div>

                </main>

            </div>

        </div>

    );

}

export default StudentDashboard;