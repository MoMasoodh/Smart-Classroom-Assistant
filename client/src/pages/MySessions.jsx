import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionCard from "../components/SessionCard";
import Loading from "../components/Loading";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function MySessions() {

    const navigate = useNavigate();
    const { teacher } = useAuth();
    const [sessions, setSessions] = useState([]);
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
        if (!closingSession) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            await api.put(`/sessions/${closingSession._id}/close`);
            setSessions((currentSessions) => currentSessions.map((session) => (
                session._id === closingSession._id
                    ? { ...session, isActive: false, closedAt: new Date().toISOString() }
                    : session
            )));
            setToast("Session Closed");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to close session.");
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

    return (
        <div className="app-page">

            <Sidebar teacher />

            <div className="content-with-sidebar">

                <Header
                    title="My Sessions"
                   subtitle="View and manage only your classroom sessions"
                    actions={
                        <button className="primary-button" onClick={() => navigate("/create-session")}>Create Session</button>
                    }
                />

                <main className="page-shell page-grid">

                    {loading ? <Loading label="Loading sessions" /> : null}

                    {error ? (
                        <div className="error-state">
                            <strong>Unable to load sessions</strong>
                            <p>{error}</p>
                        </div>
                    ) : null}

                    {!loading && !error && sortedSessions.length === 0 ? (
                        <div className="empty-state">
                           <strong>You haven't created any sessions yet.</strong>
                            <p>Create a session to start managing doubts and quizzes.</p>
                            <button className="primary-button" onClick={() => navigate("/create-session")}>
                                Create Session
                            </button>
                        </div>
                    ) : null}

                    <div className="card-grid">
                        {sortedSessions.map((session) => (
                            <SessionCard
                                key={session._id || session.sessionCode}
                                session={session}
                                onManage={() => openManageSession(session)}
                                onClose={() => setClosingSession(session)}
                            />
                        ))}
                    </div>

                </main>

            </div>

            <ConfirmDialog
                open={Boolean(closingSession)}
                title="Close Session"
                message={`Close ${closingSession?.sessionName || "this session"}? Students will no longer be able to join.`}
                confirmLabel="Close Session"
                onConfirm={handleCloseSession}
                onCancel={() => setClosingSession(null)}
            />

            <Toast message={toast} type="success" />

        </div>
    );
}

export default MySessions;