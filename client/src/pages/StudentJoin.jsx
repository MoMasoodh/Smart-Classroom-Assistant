import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { saveStoredSession, setActiveSession, setStudentProfile } from "../services/storage";
import "./StudentJoin.css";

function StudentLogin() {

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [studentName, setStudentName] = useState("");
    const [sessionCode, setSessionCode] = useState(params.sessionCode || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const routeState = location.state;

    const handleJoin = async () => {

        if (!studentName.trim() || !sessionCode.trim()) {
            setError("Please enter your name and session code.");

            return;

        }

        try {

            setLoading(true);
            setError("");

            const response = await api.get(`/sessions/${sessionCode}`);

            if (response.data.isActive) {

                const session = response.data;

                setStudentProfile({
                    studentName,
                    sessionCode: session.sessionCode,
                    session,
                });

                setActiveSession(session);

                saveStoredSession(session);

                navigate("/student-dashboard", {
                    state: {
                        studentName: studentName,
                        session: session,
                    }
                });

            }

            else {
                setError("Session is closed.");

            }

        }

        catch (error) {

            setError(error.response?.data?.message || "Unable to join session.");

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="student-join-page">

            <Navbar />

            <div className="join-page">

                <div className="join-card auth-card">

                    <span className="eyebrow">Student access</span>

                    <h1>Join Classroom</h1>

                    <p>
                        Use a session code or QR link to enter the classroom.
                    </p>

                    <form
                        className="join-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleJoin();
                        }}
                    >

                        <input
                            type="text"
                            placeholder="Enter Your Name"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Enter Session Code"
                            value={sessionCode}
                            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                        />

                        {routeState?.sessionName ? (
                            <div className="join-meta">
                                <strong>{routeState.sessionName}</strong>
                                <span>{routeState.subject}</span>
                            </div>
                        ) : null}

                        {error ? <p className="error-text">{error}</p> : null}

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Joining..." : "Join Session"}
                        </button>

                    </form>

                </div>

            </div>

        </div>

    );

}

export default StudentLogin;