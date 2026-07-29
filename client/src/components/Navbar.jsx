import { Link } from "react-router-dom";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar fade-in">
      <Link to="/" className="navbar-brand" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <GraduationCap style={{ color: "var(--primary)" }} size={26} />
        <span>Smart Classroom</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/student-login" className="button secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
          <LogIn size={16} />
          Student Portal
        </Link>
        <Link to="/teacher-login" className="button primary-button" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
          <UserPlus size={16} />
          Teacher Portal
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
