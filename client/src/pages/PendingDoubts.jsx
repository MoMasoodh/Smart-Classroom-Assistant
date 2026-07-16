import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PendingDoubts.css";

function PendingDoubts() {

    const navigate = useNavigate();
    const location = useLocation();

    const session = location.state?.session;

    const [doubts, setDoubts] = useState([]);

    useEffect(() => {

        fetchPendingDoubts();

    }, []);

    const fetchPendingDoubts = async () => {

        try {

            const response = await api.get(
                `/doubts/session/${session.sessionCode}`
            );

            const pending = response.data.filter(
                doubt => doubt.status === "Pending"
            );

            setDoubts(pending);

        } catch (error) {

            console.log(error);

            alert("Unable to load pending doubts.");

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

        <div className="pending-page">

            <h1>Pending Doubts</h1>

            {
                doubts.length === 0 ?

                <p>No pending doubts.</p>

                :

                doubts.map((doubt) => (

                    <div
                        className="pending-card"
                        key={doubt._id}
                    >

                        <h3>{doubt.studentName}</h3>

                        <p>

                            <strong>Subject:</strong> {doubt.subject}

                        </p>

                        <p>{doubt.question}</p>

                        <div className="button-group">

                            <button
                                className="answer-btn"
                                onClick={() => answerDoubt(doubt)}
                            >
                                Answer
                            </button>

                            <button
                                className="ai-btn"
                            >
                                AI Answer
                            </button>

                        </div>

                    </div>

                ))
            }

        </div>

    );

}

export default PendingDoubts;