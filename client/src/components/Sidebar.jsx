import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  clearActiveSession,
  clearStudent,
  clearStudentProfile,
} from "../services/storage";
import "./Sidebar.css";

function Sidebar({ teacher = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleStudentLogout = () => {
    clearActiveSession();
    clearStudentProfile();
    clearStudent();
    navigate("/", { replace: true });
  };

  const links = teacher
    ? [
        { to: "/teacher-dashboard", label: "Dashboard" },
        { to: "/create-session", label: "Create Session" },
        { to: "/my-sessions", label: "My Sessions" },
        { to: "/pending-doubts", label: "Pending Doubts" },
        { to: "/statistics", label: "Statistics" },
      ]
    : [
        { to: "/student-dashboard", label: "Dashboard" },
        { to: "/my-doubts", label: "My Doubts" },
        { to: "/discussion", label: "Discussion" },
        { to: "/quiz", label: "Quiz" },
        { to: "/leaderboard", label: "Leaderboard" },
      ];

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <h2 className="logo">Smart Classroom</h2>
        <p>{teacher ? "Teacher workspace" : "Student workspace"}</p>
      </div>

      <nav className="sidebar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}

        {teacher ? (
          <button type="button" className="sidebar-link secondary sidebar-button" onClick={logout}>
            Logout
          </button>
        ) : (
          <button type="button" className="sidebar-link secondary sidebar-button" onClick={handleStudentLogout}>
            Leave Session
          </button>
        )}
      </nav>

    </aside>
  );
}

export default Sidebar;