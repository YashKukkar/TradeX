import { createContext, useContext, useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import Toast from "../components/Toast";

interface ToastEntry {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastEntry["type"], duration?: number) => number;
  updateToast: (id: number, message: string, type?: ToastEntry["type"], duration?: number) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastEntry["type"] = "success", duration = 3500) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      return id;
    },
    []
  );

  const updateToast = useCallback(
    (id: number, message: string, type: ToastEntry["type"] = "success", duration = 3500) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, message, type, duration } : t))
      );
    },
    []
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissToast = dismiss;

  return (
    <ToastContext.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}
      {ReactDOM.createPortal(
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", zIndex: 9999, pointerEvents: "none" }}>
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: "all" }}>
              <Toast
                message={t.message}
                type={t.type}
                duration={t.duration}
                onClose={() => dismiss(t.id)}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
