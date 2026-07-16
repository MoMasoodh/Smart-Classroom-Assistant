import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AskDoubt.css";

function AskDoubt() {

    const navigate = useNavigate();
    const location = useLocation();

    const studentName = location.state?.studentName;
    const session = location.state?.session;

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

                sessionCode: session.sessionCode,

                subject,

                question

            });

            alert("Doubt Submitted Successfully!");

            navigate("/student-dashboard",{

                state:{

                    studentName,

                    session

                }

            });

        }

        catch(error){

            console.log(error);

            alert("Unable to submit doubt.");

        }

    };

    return(

        <div className="ask-page">

            <div className="ask-card">

                <h1>Ask Doubt</h1>

                <h3>{studentName}</h3>

                <p>Session : {session.sessionCode}</p>

                <form onSubmit={submitDoubt}>

                    <input

                        type="text"

                        placeholder="Subject"

                        value={subject}

                        onChange={(e)=>setSubject(e.target.value)}

                    />

                    <textarea

                        rows="6"

                        placeholder="Enter your doubt..."

                        value={question}

                        onChange={(e)=>setQuestion(e.target.value)}

                    />

                    <button type="submit">

                        Submit Doubt

                    </button>

                </form>

            </div>

        </div>

    );

}

export default AskDoubt;