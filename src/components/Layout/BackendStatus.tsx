import { useEffect, useState } from 'react';

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const check = async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      setStatus(data.status === 'ok' ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') return null;

  const label = status === 'online' ? 'IA disponível' : 'Backend offline — IA indisponível';

  return (
    <div
      title={label}
      aria-label={label}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: status === 'online' ? 'var(--color-success)' : 'var(--color-danger)',
        transition: 'background 500ms ease',
        cursor: 'help',
        flexShrink: 0,
      }}
    />
  );
}
