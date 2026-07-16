import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateSession.css";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { saveStoredSession, setActiveSession } from "../services/storage";

function CreateSession() {

    const navigate = useNavigate();

    const [sessionName, setSessionName] = useState("");
    const [subject, setSubject] = useState("");
    const [duration, setDuration] = useState("");

    const [createdSession, setCreatedSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");

    const createSession = async (e) => {

        e.preventDefault();

        if (!sessionName || !subject || !duration) {
            setError("Please fill all fields.");
            return;
        }

        try {

            setLoading(true);
            setError("");

            const response = await api.post("/sessions", {
                sessionName,
                subject,
                duration: Number(duration)
            });

            setCreatedSession(response.data);
            saveStoredSession(response.data);
            setActiveSession(response.data);
            setToast("Session Created");

            setSessionName("");
            setSubject("");
            setDuration("");

        } catch (error) {

            console.error(error);

            setError(error.response?.data?.message || "Unable to create session.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="app-page">

            <Sidebar teacher />

            <div className="content-with-sidebar">

                <Header
                    title="Create Session"
                    subtitle="Create a classroom room, generate the QR code, and share the session code instantly."
                    actions={
                        <button className="secondary" onClick={() => navigate("/my-sessions")}>
                            View My Sessions
                        </button>
                    }
                />

                <main className="page-shell page-grid">

                    <section className="form-card">

                        <div className="page-hero">
                            <div>
                                <span className="eyebrow">Session setup</span>
                                <h2 style={{ margin: "0.75rem 0 0.35rem" }}>Launch a new classroom in seconds.</h2>
                                <p style={{ margin: 0, color: "var(--muted)" }}>
                                    The backend will generate the session code and QR code automatically.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={createSession} className="page-section">

                            <div className="field-grid">
                                <input
                                    type="text"
                                    placeholder="Session Name"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                />

                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Duration (Minutes)"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>

                            {error ? <p className="error-text">{error}</p> : null}

                            <div className="form-actions">
                                <button className="primary-button" type="submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create Session"}
                                </button>
                            </div>

                        </form>

                    </section>

                    {loading ? <Loading label="Creating session" /> : null}

                    {createdSession ? (

                        <section className="form-card success-state" style={{ alignItems: "stretch" }}>

                            <span className="status-pill active">Session Created</span>
                            <h2 style={{ margin: 0 }}>{createdSession.sessionName}</h2>
                            <p style={{ margin: 0, color: "var(--muted)" }}>{createdSession.subject}</p>

                            <div className="field-grid">
                                <div className="hero-stat">
                                    <strong>{createdSession.sessionCode}</strong>
                                    <span>Share this code with students</span>
                                </div>
                                <div className="hero-stat">
                                    <strong>{createdSession.duration} min</strong>
                                    <span>Session duration</span>
                                </div>
                            </div>

                            <img
                                src={createdSession.qrCode}
                                alt="Session QR code"
                                style={{ width: "220px", borderRadius: "18px", background: "white", padding: "0.6rem" }}
                            />

                            <div className="form-actions">
                                <button className="primary-button" onClick={() => navigate("/manage-session", { state: { session: createdSession } })}>
                                    Manage Session
                                </button>
                                <button className="secondary" onClick={() => navigate("/my-sessions")}>
                                    View My Sessions
                                </button>
                            </div>

                        </section>

                    ) : null}

                </main>

            </div>

            <Toast message={toast} type="success" />

        </div>

    );

}

export default CreateSession;