import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, X, Info, XCircle } from 'lucide-react';

// ── Toast Types ──────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

// ── Toast Provider ───────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container — top-right, above everything */}
      <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-[380px] w-full sm:w-auto">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ── Individual Toast ─────────────────────────────────────────────────────────
const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; accent: string }> = {
  success: {
    bg: 'bg-[#0c1a0e]/95',
    border: 'border-emerald-500/40',
    icon: <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />,
    accent: 'text-emerald-300',
  },
  error: {
    bg: 'bg-[#1a0c0c]/95',
    border: 'border-red-500/40',
    icon: <XCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />,
    accent: 'text-red-300',
  },
  warning: {
    bg: 'bg-[#1a150c]/95',
    border: 'border-amber-500/40',
    icon: <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />,
    accent: 'text-amber-300',
  },
  info: {
    bg: 'bg-[#0c0f1a]/95',
    border: 'border-blue-500/40',
    icon: <Info className="w-4.5 h-4.5 text-blue-400 shrink-0" />,
    accent: 'text-blue-300',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[toast.type];

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 ${style.bg} ${style.border} ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-8 opacity-0'
      }`}
    >
      {style.icon}
      <p className={`text-xs sm:text-sm font-medium leading-snug flex-1 ${style.accent}`}>
        {toast.message}
      </p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
