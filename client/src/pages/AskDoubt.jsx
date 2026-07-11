import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AskDoubt.css";

function AskDoubt() {

    const navigate = useNavigate();
    const location = useLocation();

    const studentName = location.state?.studentName;
    const sessionCode = location.state?.session?.sessionCode;

    const [subject, setSubject] = useState("");
    const [question, setQuestion] = useState("");

    const submitDoubt = async (e) => {

        e.preventDefault();

        if (!subject || !question) {

            alert("Please fill all fields.");

            return;

        }

        try {

            await api.post("/doubts", {

                studentName,

                sessionCode,

                subject,

                question

            });

            alert("Doubt Submitted Successfully!");

            setSubject("");
            setQuestion("");

        }

        catch(error){

            console.log(error);

            alert("Unable to submit doubt.");

        }

    };

    return (

        <div className="ask-page">

            <div className="ask-card">

                <h1>Ask Doubt</h1>

                <p>

                    Student : <strong>{studentName}</strong>

                </p>

                <p>

                    Session : <strong>{sessionCode}</strong>

                </p>

                <form onSubmit={submitDoubt}>

                    <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e)=>setSubject(e.target.value)}
                    />

                    <textarea
                        placeholder="Type your doubt here..."
                        value={question}
                        onChange={(e)=>setQuestion(e.target.value)}
                        rows="6"
                    />

                    <button type="submit">

                        Submit Doubt

                    </button>

                </form>

                <button
                    className="back-btn"
                    onClick={()=>navigate("/student-dashboard")}
                >

                    Back

                </button>

            </div>

        </div>

    );

}

export default AskDoubt;