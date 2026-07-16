import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import DoubtCard from "../components/DoubtCard";
import { getStoredSessions, getActiveSession } from "../services/storage";
import "./PendingDoubts.css";

function PendingDoubts() {

    const navigate = useNavigate();
    const location = useLocation();

    const session = location.state?.session || getActiveSession() || getStoredSessions()[0];

    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.sessionCode) {
            fetchPendingDoubts();
        } else {
            setLoading(false);
            setError("Session not found.");
        }

    }, [session?.sessionCode]);

    const fetchPendingDoubts = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                `/doubts/session/${session.sessionCode}/pending`
            );

            setDoubts(response.data);

        } catch (error) {

            console.log(error);

            setError(error.response?.data?.message || "Unable to load pending doubts.");

        } finally {

            setLoading(false);

        }

    };

    const answerDoubt = (doubt) => {

        navigate("/answer-doubt", {

            state: {

                doubt,
                session

            }

        });

    };

    return (

        <div className="app-page">

            <Sidebar teacher />

            <div className="content-with-sidebar">

                <Header
                    title="Pending Doubts"
                    subtitle={session ? `Session ${session.sessionCode}` : "Teacher review queue"}
                    actions={
                        <button className="secondary" onClick={() => navigate("/manage-session", { state: { session } })}>
                            Back to Session
                        </button>
                    }
                />

                <main className="page-shell">

                    {loading ? <Loading label="Loading pending doubts" /> : null}

                    {error ? (
                        <div className="error-state">
                            <strong>Unable to load pending doubts</strong>
                            <p>{error}</p>
                        </div>
                    ) : null}

                    {!loading && !error && doubts.length === 0 ? (
                        <div className="empty-state">
                            <strong>No pending doubts.</strong>
                            <p>All student questions in this session have already been answered.</p>
                        </div>
                    ) : null}

                    <div className="card-grid">
                        {doubts.map((doubt) => (
                            <DoubtCard
                                key={doubt._id}
                                doubt={doubt}
                                onAnswer={() => answerDoubt(doubt)}
                                onAiAnswer={() => navigate("/answer-doubt", { state: { doubt, session, mode: "ai" } })}
                            />
                        ))}
                    </div>

                </main>

            </div>

        </div>

    );

}

export default PendingDoubts;