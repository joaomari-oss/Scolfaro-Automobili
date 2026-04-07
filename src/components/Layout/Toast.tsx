import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;
let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null;

export function showToast(type: 'success' | 'error' | 'info', message: string) {
  addToastFn?.({ type, message });
}

const typeConfig = {
  success: { icon: CheckCircle, color: 'var(--color-success)', border: '#22C55E' },
  error:   { icon: XCircle,     color: 'var(--color-danger)',  border: '#EF4444' },
  info:    { icon: Info,        color: 'var(--color-info)',    border: '#3B82F6' },
};

export default function Toast({ theme: _theme }: { theme: 'dark' | 'light' }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (msg) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { ...msg, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(toast => {
        const cfg = typeConfig[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className="sa-toast flex items-start gap-3"
            style={{ borderLeft: `3px solid ${cfg.border}` }}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <p
              className="text-sm flex-1 leading-snug"
              style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}
            >
              {toast.message}
            </p>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-0.5 rounded shrink-0 opacity-40 hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
