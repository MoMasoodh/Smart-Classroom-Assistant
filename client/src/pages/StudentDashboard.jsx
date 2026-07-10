import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCard from "../components/DashboardCard";

function StudentDashboard() {
  return (
    <>
      <Sidebar />

      <Header
        title="Student Dashboard"
        subtitle="Welcome, Mohamed"
      />

      <div
        style={{
          marginLeft: "270px",
          padding: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
        }}
      >
        <DashboardCard
          icon="❓"
          title="Ask Doubt"
          description="Submit your doubts to the teacher."
        />

        <DashboardCard
          icon="📋"
          title="My Doubts"
          description="View your submitted doubts."
        />

        <DashboardCard
          icon="💬"
          title="Discussion"
          description="View answered class doubts."
        />

        <DashboardCard
          icon="📝"
          title="Quiz"
          description="Attend the current quiz."
        />

        <DashboardCard
          icon="🏆"
          title="Leaderboard"
          description="View class rankings."
        />
      </div>
    </>
  );
}

export default StudentDashboard;