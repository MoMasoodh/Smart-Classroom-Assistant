import { useState } from "react";
import "./CreateSession.css";
import api from "../services/api";

function CreateSession() {

    const [sessionName, setSessionName] = useState("");
    const [subject, setSubject] = useState("");
    const [duration, setDuration] = useState("");

    const [createdSession, setCreatedSession] = useState(null);

    const createSession = async (e) => {

        e.preventDefault();

        if (!sessionName || !subject || !duration) {
            alert("Please fill all fields.");
            return;
        }

        try {

            const response = await api.post("/sessions", {
                sessionName,
                subject,
                duration
            });

            setCreatedSession(response.data);

            setSessionName("");
            setSubject("");
            setDuration("");

        } catch (error) {

            console.error(error);

            alert("Unable to create session.");

        }

    };

    return (

        <div className="create-session">

            <div className="session-box">

                <h1>Create Session</h1>

                <form onSubmit={createSession}>

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
                        placeholder="Duration (Minutes)"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                    />

                    <button type="submit">

                        Create Session

                    </button>

                </form>

                {createdSession && (

                    <div style={{ marginTop: "30px" }}>

                        <h2 style={{ color: "green" }}>
                            ✅ Session Created Successfully
                        </h2>

                        <p>
                            <strong>Session Name:</strong>{" "}
                            {createdSession.sessionName}
                        </p>

                        <p>
                            <strong>Subject:</strong>{" "}
                            {createdSession.subject}
                        </p>

                        <p>
                            <strong>Session Code:</strong>{" "}
                            {createdSession.sessionCode}
                        </p>

                        <p>
                            <strong>Duration:</strong>{" "}
                            {createdSession.duration} Minutes
                        </p>

                        <h3>QR Code</h3>

                        <img
                            src={createdSession.qrCode}
                            alt="QR Code"
                            width="220"
                        />

                    </div>

                )}

            </div>

        </div>

    );

}

export default CreateSession;