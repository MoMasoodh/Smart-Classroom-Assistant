import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function StudentLogin() {

    const navigate = useNavigate();

    const [studentName, setStudentName] = useState("");
    const [sessionCode, setSessionCode] = useState("");

    const handleJoin = async () => {

        if (!studentName || !sessionCode) {

            alert("Please enter your name and session code.");

            return;

        }

        try {

            const response = await api.get(`/sessions/${sessionCode}`);

            if (response.data.isActive) {

                navigate("/student-dashboard", {
    state: {
        studentName: studentName,
        session: response.data
    }
});

            }

            else {

                alert("Session is closed.");

            }

        }

        catch (error) {

            alert("Invalid Session Code.");

            console.log(error);

        }

    };

    return (

        <div className="home">

            <div className="card">

                <h2>Join Classroom</h2>

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
                    onChange={(e) => setSessionCode(e.target.value)}
                />

                <button
                    className="join-btn"
                    onClick={handleJoin}
                >
                    Join Session
                </button>

            </div>

        </div>

    );

}

export default StudentLogin;