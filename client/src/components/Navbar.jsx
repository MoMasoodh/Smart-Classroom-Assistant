import { Link } from "react-router-dom";
import { GraduationCap, LogIn, UserCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="navbar fade-in">
      <Link to="/" className="navbar-brand">
        <div className="navbar-brand-logo">
          <GraduationCap size={24} />
        </div>
        <span>Smart Classroom</span>
      </Link>

      <nav className="navbar-links">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link to="/student-login" className="button secondary" style={{ padding: "0.55rem 1.1rem", fontSize: "0.875rem" }}>
          <LogIn size={16} />
          <span>Student Portal</span>
        </Link>
        
        <Link to="/teacher-login" className="button primary-button" style={{ padding: "0.55rem 1.1rem", fontSize: "0.875rem" }}>
          <UserCheck size={16} />
          <span>Teacher Portal</span>
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
