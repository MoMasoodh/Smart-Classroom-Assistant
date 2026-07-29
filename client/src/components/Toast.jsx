import { useEffect } from "react";
import { useToast } from "../contexts/ToastContext";

function Toast({ message, type = "info" }) {
  const { addToast } = useToast();

  useEffect(() => {
    if (message) {
      addToast(message, type);
    }
  }, [message, type, addToast]);

  return null;
}

export default Toast;