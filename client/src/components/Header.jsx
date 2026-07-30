import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import "./Header.css";

function Header({ title, subtitle, actions }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="header fade-in">
      <div className="header-title-group">
        <h1 className="header-title">{title}</h1>
        {subtitle ? <p className="header-subtitle">{subtitle}</p> : null}
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {actions}
      </div>
    </header>
  );
}

export default Header;