import { useEffect, useState } from 'react';
import { API_BASE } from '../../utils/api';

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const check = async () => {
    if (!API_BASE) { setStatus('offline'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      setStatus(data.status === 'ok' ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Só mostra quando o backend está online (indicador positivo, não alarme de erro)
  if (status !== 'online') return null;

  return (
    <div
      title="Backend online"
      aria-label="Backend online"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--color-success)',
        flexShrink: 0,
      }}
    />
  );
}
