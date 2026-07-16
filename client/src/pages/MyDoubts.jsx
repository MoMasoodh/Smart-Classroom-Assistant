import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./MyDoubts.css";

function MyDoubts() {

    const navigate = useNavigate();
    const location = useLocation();

    const studentName = location.state?.studentName;
    const session = location.state?.session;

    const [doubts, setDoubts] = useState([]);

    useEffect(() => {

        fetchDoubts();

    }, []);

    const fetchDoubts = async () => {

        try {

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

            alert("Unable to load doubts.");

        }

    };

    return (

        <div className="my-doubts-page">

            <h1>My Doubts</h1>

            <button
                className="back-btn"
                onClick={() =>
                    navigate("/student-dashboard", {
                        state: {
                            studentName,
                            session
                        }
                    })
                }
            >
                ← Back
            </button>

            {

                doubts.length === 0 ?

                (

                    <p>No doubts submitted yet.</p>

                )

                :

                (

                    doubts.map((doubt) => (

                        <div
                            className="doubt-card"
                            key={doubt._id}
                        >

                            <h3>{doubt.subject}</h3>

                            <p>{doubt.question}</p>

                            <p>

                                <strong>Status : </strong>

                                {doubt.status}

                            </p>

                            {

                                doubt.answer &&

                                <>

                                    <hr />

                                    <p>

                                        <strong>Teacher Answer</strong>

                                    </p>

                                    <p>{doubt.answer}</p>

                                </>

                            }

                        </div>

                    ))

                )

            }

        </div>

    );

}

export default MyDoubts;