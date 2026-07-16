import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionCard from "../components/SessionCard";
import Loading from "../components/Loading";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import api from "../services/api";
import { getStoredSessions, updateStoredSession } from "../services/storage";

function MySessions() {

    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [closingSession, setClosingSession] = useState(null);

    useEffect(() => {
        setSessions(getStoredSessions());
        setLoading(false);
    }, []);

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
            const nextSessions = updateStoredSession(closingSession.sessionCode, { isActive: false });
            setSessions(nextSessions);
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
                    subtitle="All classroom sessions saved in this browser"
                    actions={
                        <button className="primary-button" onClick={() => navigate("/create-session")}>Create Session</button>
                    }
                />

                <main className="page-shell page-grid">

                    {loading ? <Loading label="Loading sessions" /> : null}

                    {error ? (
                        <div className="error-state">
                            <strong>Unable to update sessions</strong>
                            <p>{error}</p>
                        </div>
                    ) : null}

                    {!loading && !error && sortedSessions.length === 0 ? (
                        <div className="empty-state">
                            <strong>No sessions created yet.</strong>
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