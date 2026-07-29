import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite" role="region">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type} slide-up`}>
            <div className="toast-icon">
              {toast.type === "success" && <CheckCircle2 size={20} />}
              {toast.type === "error" && <XCircle size={20} />}
              {toast.type === "warning" && <AlertCircle size={20} />}
              {toast.type === "info" && <Info size={20} />}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback so component calls won't throw if rendered outside provider during transitions
    return {
      addToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
      removeToast: () => {},
    };
  }
  return context;
}
