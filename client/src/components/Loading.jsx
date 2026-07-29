import { Loader2 } from "lucide-react";

function Loading({ label = "Loading data..." }) {
  return (
    <div className="loading-state fade-in" role="status" aria-live="polite">
      <Loader2 className="spinner-icon" size={36} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
      <p style={{ margin: 0, fontWeight: 500, color: "var(--text-muted)", fontSize: "0.95rem" }}>{label}</p>
    </div>
  );
}

export default Loading;