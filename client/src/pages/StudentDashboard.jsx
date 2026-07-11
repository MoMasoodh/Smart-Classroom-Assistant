import { useNavigate,useLocation  } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";

import "./StudentDashboard.css";

function StudentDashboard() {

   const navigate = useNavigate();
const location = useLocation();

const studentName = location.state?.studentName || "Student";
const session = location.state?.session;

    return (

        <>

            <Sidebar />

            <Header
    title="Student Dashboard"
    subtitle={`Welcome, ${studentName}`}
/>

            <div className="student-dashboard">

               <DashboardCard
    icon="❓"
    title="Ask Doubt"
    description="Submit your doubts to the teacher."
    onClick={() =>
        navigate("/ask-doubt", {
            state: {
                studentName,
                session
            }
        })
    }
/>

                <DashboardCard
    icon="📋"
    title="My Doubts"
    description="View all your submitted doubts."
    onClick={() =>
        navigate("/my-doubts", {
            state: {
                studentName,
                session
            }
        })
    }
/>
                <DashboardCard
    icon="💬"
    title="Discussion"
    description="View answered classroom doubts."
    onClick={() =>
        navigate("/discussion", {
            state: {
                studentName,
                session
            }
        })
    }
/>

                <DashboardCard
    icon="📝"
    title="Quiz"
    description="Attend classroom quizzes."
    onClick={() =>
        navigate("/quiz", {
            state: {
                studentName,
                session
            }
        })
    }
/>

                <DashboardCard
    icon="🏆"
    title="Leaderboard"
    description="View class rankings."
    onClick={() =>
        navigate("/leaderboard", {
            state: {
                studentName,
                session
            }
        })
    }
/>

                <DashboardCard
    icon="🚪"
    title="Leave Session"
    description="Return to Home Page."
    onClick={() => navigate("/")}
/>

            </div>

        </>

    );

}

export default StudentDashboard;