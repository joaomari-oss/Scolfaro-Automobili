import type { ReactElement } from 'react';
import type { TipoVeiculo } from '../../types/veiculo';

interface CategoriaCardProps {
  tipo: TipoVeiculo;
  label: string;
  count: number;
  theme: 'dark' | 'light';
  onClick: () => void;
  selected?: boolean;
}

const silhouettes: Record<TipoVeiculo, ReactElement> = {
  sedan: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M10,45 L15,45 L20,30 L40,20 L80,20 L95,30 L110,30 L110,45 L95,45 L92,40 L88,45 L32,45 L28,40 L24,45 L10,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="45" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="90" cy="45" r="6" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  suv: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M10,45 L15,45 L18,22 L35,12 L85,12 L100,22 L110,25 L112,45 L95,45 L92,38 L88,45 L32,45 L28,38 L24,45 L10,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="28" cy="45" r="7" fill="currentColor" opacity="0.9" />
      <circle cx="92" cy="45" r="7" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  esportivo: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M5,42 L15,42 L25,32 L45,26 L85,26 L100,32 L115,35 L115,42 L100,42 L97,38 L93,42 L27,42 L23,38 L19,42 L5,42 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="25" cy="42" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="95" cy="42" r="6" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  hatch: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M12,45 L18,45 L22,28 L42,18 L80,18 L90,28 L100,30 L100,45 L90,45 L87,40 L83,45 L32,45 L28,40 L24,45 L12,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="28" cy="45" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="87" cy="45" r="6" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  picape: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M8,45 L15,45 L18,25 L35,15 L60,15 L65,25 L110,25 L112,45 L95,45 L92,38 L88,45 L32,45 L28,38 L24,45 L8,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="28" cy="45" r="7" fill="currentColor" opacity="0.9" />
      <circle cx="92" cy="45" r="7" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  conversivel: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M8,42 L18,42 L25,30 L50,28 L80,28 L100,32 L112,36 L112,42 L98,42 L95,38 L91,42 L29,42 L25,38 L21,42 L8,42 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="25" cy="42" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="95" cy="42" r="6" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  moto: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M35,42 L40,25 L55,18 L65,18 L70,22 L80,22 L85,28 L90,35 L85,42 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="42" r="9" fill="currentColor" opacity="0.9" />
      <circle cx="90" cy="42" r="9" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  van: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M10,45 L15,45 L18,12 L90,12 L105,25 L110,35 L110,45 L95,45 L92,38 L88,45 L32,45 L28,38 L24,45 L10,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="28" cy="45" r="7" fill="currentColor" opacity="0.9" />
      <circle cx="92" cy="45" r="7" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  utilitario: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M10,45 L15,45 L18,15 L85,15 L100,28 L110,32 L110,45 L95,45 L92,38 L88,45 L32,45 L28,38 L24,45 L10,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="28" cy="45" r="7" fill="currentColor" opacity="0.9" />
      <circle cx="92" cy="45" r="7" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  classico: (
    <svg viewBox="0 0 120 60" className="w-full h-full">
      <path d="M8,45 L16,45 L20,30 L35,18 L85,18 L98,28 L110,32 L110,45 L98,45 L95,40 L91,45 L29,45 L25,40 L21,45 L8,45 Z"
        fill="currentColor" opacity="0.7" />
      <circle cx="25" cy="45" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="95" cy="45" r="6" fill="currentColor" opacity="0.9" />
      <line x1="38" y1="30" x2="42" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="58" y1="30" x2="58" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="78" y1="30" x2="78" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),
};

const labels: Record<TipoVeiculo, string> = {
  sedan:      'Sedan',
  suv:        'SUV / 4x4',
  esportivo:  'Esportivo',
  hatch:      'Hatch',
  picape:     'Picape',
  conversivel:'Conversível',
  moto:       'Moto',
  van:        'Van',
  utilitario: 'Utilitário',
  classico:   'Clássico',
};

export { labels as categoriaLabels, silhouettes as categoriaSilhouettes };

export default function CategoriaCard({ tipo, label, count, onClick, selected = false }: CategoriaCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: selected ? 'var(--accent-primary-muted)' : 'var(--bg-secondary)',
        borderColor: selected ? 'var(--accent-primary)' : 'var(--border-primary)',
        boxShadow: selected ? 'var(--shadow-accent)' : 'var(--shadow-sm)',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          e.currentTarget.style.borderColor = 'var(--accent-primary-border)';
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }
      }}
    >
      <div
        className="w-20 h-10 mb-3"
        style={{ color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
      >
        {silhouettes[tipo]}
      </div>
      <span
        className="font-display font-semibold text-sm mb-1"
        style={{ color: selected ? 'var(--accent-primary)' : 'var(--text-primary)' }}
      >
        {label}
      </span>
      <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>
        {count} {count === 1 ? 'veículo' : 'veículos'}
      </span>
    </button>
  );
}
