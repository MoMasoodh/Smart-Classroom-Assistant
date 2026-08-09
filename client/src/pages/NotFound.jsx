import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)",
        color: "var(--text)",
        padding: "1.5rem",
      }}
    >
      <div className="hero-card" style={{ maxWidth: "480px", textAlign: "center", padding: "2.5rem" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--danger-bg)",
            color: "var(--danger)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <span className="eyebrow" style={{ color: "var(--danger)" }}>404 Page Not Found</span>
        <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.5rem" }}>Oops! Page Not Found</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
          The page or session link you are looking for does not exist or may have been moved.
        </p>

        <div className="form-actions" style={{ justifyContent: "center" }}>
          <button className="primary-button" onClick={() => navigate("/")}>
            <Home size={16} /> Return to Home
          </button>
          <button className="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
