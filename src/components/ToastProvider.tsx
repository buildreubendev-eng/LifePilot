"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const toast: Toast = { id, message, variant, createdAt: Date.now() };
      setToasts((prev) => [...prev.slice(-4), toast]); // max 5 visible
      // Auto-dismiss
      setTimeout(() => removeToast(id), variant === "error" ? 6000 : 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

const variantConfig: Record<ToastVariant, { icon: ReactNode; border: string; bg: string; text: string }> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/80",
    text: "text-emerald-200",
  },
  error: {
    icon: <XCircle size={16} />,
    border: "border-red-500/30",
    bg: "bg-red-950/80",
    text: "text-red-200",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    border: "border-amber-500/30",
    bg: "bg-amber-950/80",
    text: "text-amber-200",
  },
  info: {
    icon: <Info size={16} />,
    border: "border-blue-500/30",
    bg: "bg-blue-950/80",
    text: "text-blue-200",
  },
};

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[70] flex flex-col gap-2 lg:bottom-6 lg:right-6"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast, i) => {
        const config = variantConfig[toast.variant];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-slide-up ${config.border} ${config.bg}`}
            style={{ animationDelay: `${i * 50}ms` }}
            role="alert"
          >
            <span className={config.text}>{config.icon}</span>
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-lg p-1 text-stone-500 transition-colors hover:text-white hover:bg-white/5"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
