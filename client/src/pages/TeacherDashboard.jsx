import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";

function TeacherDashboard() {

    const navigate = useNavigate();

    return (

        <div className="dashboard-container">

            <h1>Teacher Dashboard</h1>

            <p className="welcome-text">
                Welcome to Smart Classroom Assistant
            </p>

            <div className="card-container">

                <div
                    className="dashboard-card"
                    onClick={() => navigate("/create-session")}
                >
                    <h2>➕ Create Session</h2>
                    <p>Create a new classroom session.</p>
                </div>

                <div
                    className="dashboard-card"
                    onClick={() => navigate("/my-sessions")}
                >
                    <h2>📚 My Sessions</h2>
                    <p>View all classroom sessions.</p>
                </div>

                <div
                    className="dashboard-card"
                    onClick={() => navigate("/statistics")}
                >
                    <h2>📊 Statistics</h2>
                    <p>View classroom analytics.</p>
                </div>

                <div
                    className="dashboard-card"
                >
                    <h2>🤖 AI Assistant</h2>
                    <p>Generate AI answers and quizzes.</p>
                </div>

                <div
                    className="dashboard-card logout-card"
                    onClick={() => navigate("/")}
                >
                    <h2>🚪 Logout</h2>
                    <p>Return to Home Page.</p>
                </div>

            </div>

        </div>

    );

}

export default TeacherDashboard;