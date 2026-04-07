import { useState } from 'react';
import { Star, Trash2, Car } from 'lucide-react';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency, formatKm } from '../../utils/formatters';

interface VeiculoCardProps {
  veiculo: Veiculo;
  theme: 'dark' | 'light';
  onOpen: (v: Veiculo) => void;
  onToggleFavorito: (id: string) => void;
  onRemove: (v: Veiculo) => void;
}

export default function VeiculoCard({ veiculo, onOpen, onToggleFavorito, onRemove }: VeiculoCardProps) {
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleFavorito = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorito(veiculo.id);
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);
  };

  const diff = veiculo.valorMercado - veiculo.valorFipe;
  const diffPositive = diff >= 0;

  return (
    <div className="vehicle-card" onClick={() => onOpen(veiculo)}>

      {/* Photo area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {veiculo.fotos.length > 0 ? (
          <img
            src={veiculo.fotos[0]}
            alt={veiculo.modelo}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 400ms ease' }}
            onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.04)')}
            onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
          />
        ) : (
          <div className="photo-placeholder">
            <Car className="w-14 h-14" style={{ color: 'var(--border-primary)' }} />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        />

        {/* Carroceria badge */}
        <div className="absolute top-3 left-3">
          <span className="sa-badge text-[11px]">{veiculo.carroceria}</span>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={handleFavorito}
            className="p-1.5 rounded-lg backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            aria-label={veiculo.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star
              className={`w-4 h-4 ${heartAnimating ? 'animate-heart-pop' : ''}`}
              fill={veiculo.favorito ? 'var(--accent-primary)' : 'none'}
              style={{ color: veiculo.favorito ? 'var(--accent-primary)' : 'rgba(255,255,255,0.7)' }}
            />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(veiculo); }}
            className="p-1.5 rounded-lg backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            aria-label="Remover veículo"
          >
            <Trash2 className="w-4 h-4" style={{ color: 'rgba(239,68,68,0.85)' }} />
          </button>
        </div>

        {/* Placa badge (bottom-left on image) */}
        <div className="absolute bottom-2 left-3">
          <span
            className="text-[11px] px-2 py-0.5 rounded font-data"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {veiculo.placa}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Brand */}
        <p className="sa-label text-[11px] uppercase tracking-widest mb-1">
          {veiculo.marca}
        </p>

        {/* Model + Year */}
        <h3
          className="font-display font-bold text-base leading-tight mb-2 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {veiculo.modelo}
          <span className="font-normal text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
            {veiculo.ano}
          </span>
        </h3>

        {/* Km */}
        <p className="font-data text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          {formatKm(veiculo.quilometragem)}
        </p>

        {/* Divider */}
        <div className="sa-divider mb-3" />

        {/* Values */}
        <div className="flex items-end justify-between">
          <div>
            <p className="sa-label text-[10px] mb-0.5">MERCADO</p>
            <p className="font-data font-medium text-base" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(veiculo.valorMercado)}
            </p>
          </div>
          <div className="text-right">
            <p className="sa-label text-[10px] mb-0.5">FIPE</p>
            <p className="font-data text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(veiculo.valorFipe)}
            </p>
          </div>
        </div>

        {/* Diff badge */}
        {diff !== 0 && (
          <div className="mt-2">
            <span
              className="font-data text-[11px] px-2 py-0.5 rounded"
              style={{
                backgroundColor: diffPositive
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
                color: diffPositive ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {diffPositive ? '+' : ''}{formatCurrency(diff)} vs FIPE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
