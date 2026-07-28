import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { saveStoredSession, setActiveSession, setStudentProfile ,getStudent} from "../services/storage";
import "./StudentJoin.css";

function StudentLogin() {

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    
    const [sessionCode, setSessionCode] = useState(params.sessionCode || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const routeState = location.state;
    const loggedInStudent = getStudent();

    const handleJoin = async () => {

       if (!loggedInStudent || !sessionCode.trim()) {
    setError("Please login before joining a session.");
    return;
}

        try {

            setLoading(true);
            setError("");

            const response = await api.get(`/sessions/${sessionCode}`);

            const session = response.data;

if (!session.isActive) {

    setError(
        "❌ This session has been closed by the teacher."
    );

    return;
}

if (
    session.expiresAt &&
    new Date(session.expiresAt) < new Date()
) {

    setError(
        "⌛ This session has expired."
    );

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

navigate("/student-dashboard", {
    state: {
        studentName: loggedInStudent.student.fullName,
        registerNumber: loggedInStudent.student.registerNumber,
        session,
    },
});

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