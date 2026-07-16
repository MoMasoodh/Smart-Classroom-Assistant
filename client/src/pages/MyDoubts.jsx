import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Loading from "../components/Loading";
import DoubtCard from "../components/DoubtCard";
import { getStudentProfile, getActiveSession } from "../services/storage";
import "./MyDoubts.css";

function MyDoubts() {

    const navigate = useNavigate();
    const location = useLocation();

    const storedProfile = getStudentProfile();
    const studentName = location.state?.studentName || storedProfile?.studentName || "Student";
    const session = location.state?.session || storedProfile?.session || getActiveSession();

    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session?.sessionCode) {
            fetchDoubts();
        } else {
            setLoading(false);
            setError("Session not found.");
        }

    }, [session?.sessionCode]);

    const fetchDoubts = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                `/doubts/session/${session.sessionCode}`
            );

            const myDoubts = response.data.filter(
                doubt => doubt.studentName === studentName
            );

            setDoubts(myDoubts);

        }

        catch(error){

            console.log(error);

            setError(error.response?.data?.message || "Unable to load doubts.");

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
                    subtitle={session ? `Session ${session.sessionCode} · ${studentName}` : studentName}
                    actions={
                        <button
                            className="secondary"
                            onClick={() => navigate("/student-dashboard", { state: { studentName, session } })}
                        >
                            Back to Dashboard
                        </button>
                    }
                />

                <main className="page-shell">

                    {loading ? <Loading label="Loading doubts" /> : null}

                    {error ? (
                        <div className="error-state">
                            <strong>Unable to load doubts</strong>
                            <p>{error}</p>
                        </div>
                    ) : null}

                    {!loading && !error && doubts.length === 0 ? (
                        <div className="empty-state">
                            <strong>No doubts submitted yet.</strong>
                            <p>Ask your first question to see it appear here.</p>
                            <button className="primary-button" onClick={() => navigate("/ask-doubt", { state: { studentName, session } })}>
                                Ask Doubt
                            </button>
                        </div>
                    ) : null}

                    <div className="page-grid">
                        {doubts.map((doubt) => (
                            <DoubtCard
                                key={doubt._id}
                                doubt={doubt}
                                readOnly
                            />
                        ))}
                    </div>

                </main>

            </div>

        </div>

    );

}

export default MyDoubts;