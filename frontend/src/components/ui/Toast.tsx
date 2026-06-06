import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toast: (type: ToastItem['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastItem['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  const colors: Record<string, string> = {
    success: '#0f9d58',
    error: '#d93025',
    info: '#1a73e8',
  };

  const bgColors: Record<string, string> = {
    success: '#e8f5e9',
    error: '#ffebee',
    info: '#e8f0fe',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: bgColors[t.type],
            border: `1px solid ${colors[t.type]}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            color: colors[t.type],
            fontWeight: 500,
            fontSize: '0.85rem',
            minWidth: 280,
            maxWidth: 420,
            animation: 'slideIn 0.2s ease',
          }}>
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors[t.type], padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
