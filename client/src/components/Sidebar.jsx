import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  clearActiveSession,
  clearStudent,
  clearStudentProfile,
  getStudent,
} from "../services/storage";
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  HelpCircle,
  BarChart3,
  MessageSquare,
  FileText,
  Trophy,
  LogOut,
  GraduationCap,
  UserCheck,
  Menu,
  X,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar({ teacher = false }) {
  const { teacher: teacherData, logout } = useAuth();
  const student = getStudent();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleStudentLogout = () => {
    clearActiveSession();
    clearStudentProfile();
    clearStudent();
    navigate("/", { replace: true });
  };

  const links = teacher
    ? [
        { to: "/teacher-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/create-session", label: "Create Session", icon: PlusCircle },
        { to: "/my-sessions", label: "My Sessions", icon: BookOpen },
        { to: "/pending-doubts", label: "Pending Doubts", icon: HelpCircle },
        { to: "/statistics", label: "Statistics", icon: BarChart3 },
      ]
    : [
        { to: "/student-dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/my-doubts", label: "My Doubts", icon: HelpCircle },
        { to: "/discussion", label: "Discussion", icon: MessageSquare },
        { to: "/quiz", label: "Quiz", icon: FileText },
        { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      ];

  const userName = teacher
    ? teacherData?.fullName || "Teacher"
    : student?.student?.fullName || "Student";
  const userSubtext = teacher
    ? teacherData?.email || "Teacher Account"
    : student?.student?.registerNumber || "Student Account";

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Navigation Menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-wrapper">
            <GraduationCap className="brand-icon" size={28} />
            <div>
              <h2 className="logo">Smart Classroom</h2>
              <span className="workspace-badge">
                {teacher ? "Teacher Workspace" : "Student Workspace"}
              </span>
            </div>
          </div>
        </div>

        {/* User Card inside Sidebar */}
        <div className="sidebar-user-card">
          <div className="avatar-chip">
            {teacher ? <UserCheck size={18} /> : <GraduationCap size={18} />}
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-subtext">{userSubtext}</span>
          </div>
        </div>

        <nav className="sidebar-links">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} className="link-icon" />
                <span className="link-label">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={teacher ? logout : handleStudentLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;