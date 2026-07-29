import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="modal-card scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: danger ? "var(--danger-bg)" : "var(--primary-light)",
                color: danger ? "var(--danger)" : "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 id="confirm-title" style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>
          {message}
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "danger" : "primary-button"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;