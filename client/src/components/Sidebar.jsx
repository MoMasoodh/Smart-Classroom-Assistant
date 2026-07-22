import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Sidebar.css";

function Sidebar({ teacher = false }) {
  const { logout } = useAuth();

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
          <NavLink to="/" className="sidebar-link secondary">
            Leave Session
          </NavLink>
        )}
      </nav>

    </aside>
  );
}

export default Sidebar;