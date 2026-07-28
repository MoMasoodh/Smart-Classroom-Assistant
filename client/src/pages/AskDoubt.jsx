import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { getStudentProfile, getActiveSession, getStudent } from "../services/storage";
import "./AskDoubt.css";

function AskDoubt() {

    const navigate = useNavigate();
    const location = useLocation();

    const student = getStudent();

    if (!student) {
        return <Navigate to="/student-login" replace />;
    }

    const profile = getStudentProfile();
    const studentName = location.state?.studentName || profile?.studentName || student?.student?.fullName || "Student";
    const registerNumber = location.state?.registerNumber || profile?.registerNumber || student?.student?.registerNumber || "";
    const session = location.state?.session || profile?.session || getActiveSession();
    const sessionCode = session?.sessionCode || "";

    const [subject, setSubject] = useState("");
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");

    const submitDoubt = async (e) => {

        e.preventDefault();

        if (!subject || !question) {
            setError("Please fill all fields.");

            return;

        }

        try {

            setLoading(true);
            setError("");

            await api.post("/doubts", {
                studentName: student.student.fullName,
                registerNumber: student.student.registerNumber,
                sessionCode,
                subject,
                question,
            });

            setToast("Doubt Submitted");

            navigate("/my-doubts",{

                state:{

                    studentName,
                    registerNumber,

                    session

                }

            });

        }

        catch(error){

            console.log(error);

            setError(error.response?.data?.message || "Unable to submit doubt.");

        } finally {

            setLoading(false);

        }

    };

    return(

        <div className="app-page">

            <Sidebar />

            <div className="content-with-sidebar">

                <Header
                    title="Ask Doubt"
                    subtitle={session ? `Session ${session.sessionCode} · ${studentName}` : studentName}
                />

                <main className="page-shell">

                    <section className="form-card">

                        <div className="page-hero">
                            <span className="eyebrow">Student doubt</span>
                            <h2 style={{ margin: "0.75rem 0 0.35rem" }}>Write a clear question and keep it short.</h2>
                            <p style={{ margin: 0, color: "var(--muted)" }}>
                                The teacher will see your doubt in the pending queue and can answer manually or with AI.
                            </p>
                        </div>

                        <form onSubmit={submitDoubt} className="page-section">

                            <div className="field-grid">
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    value={subject}
                                    onChange={(e)=>setSubject(e.target.value)}
                                />
                            </div>

                            <textarea
                                rows="7"
                                placeholder="Enter your doubt..."
                                value={question}
                                onChange={(e)=>setQuestion(e.target.value)}
                            />

                            {error ? <p className="error-text">{error}</p> : null}

                            <div className="form-actions">
                                <button type="button" className="secondary" onClick={() => navigate("/student-dashboard", { state: { studentName, registerNumber, session } })}>
                                    Back to Dashboard
                                </button>

                                <button className="primary-button" type="submit" disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Doubt"}
                                </button>
                            </div>

                        </form>

                        {loading ? <Loading label="Submitting doubt" /> : null}

                    </section>

                </main>

            </div>

            <Toast message={toast} type="success" />

        </div>

    );

}

export default AskDoubt;