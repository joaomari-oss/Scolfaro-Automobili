/**
 * A4 – TimelineColecao
 * Linha do tempo da coleção, ordenada por ano de compra/adição.
 */
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculos: Veiculo[];
  onSelectVeiculo?: (v: Veiculo) => void;
}

export default function TimelineColecao({ veiculos, onSelectVeiculo }: Props) {
  const ordenados = [...veiculos].sort((a, b) => a.ano - b.ano);

  if (ordenados.length === 0) return null;

  return (
    <div className="relative pl-10">
      {/* Linha vertical */}
      <div
        className="timeline-line"
        style={{ top: 20 }}
      />

      <div className="space-y-6">
        {ordenados.map((v) => (
          <div key={v.id} className="relative animate-fade-in-up">
            {/* Bullet */}
            <div
              className="absolute -left-10 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-primary)',
                borderColor: 'var(--bg-primary)',
                zIndex: 1,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Card */}
            <button
              className="w-full text-left sa-card-hover rounded-xl p-4 border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)',
              }}
              onClick={() => onSelectVeiculo?.(v)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span
                    className="font-data text-xs font-bold px-2 py-0.5 rounded mb-2 inline-block"
                    style={{ backgroundColor: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}
                  >
                    {v.ano}
                  </span>
                  <p className="sa-label text-[11px] uppercase tracking-widest">{v.marca}</p>
                  <p className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {v.modelo}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {v.carroceria} · {v.cor} · {v.combustivel}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-data font-semibold text-sm" style={{ color: 'var(--accent-primary)' }}>
                    {formatCurrency(v.valorMercado)}
                  </p>
                  {v.fotos.length > 0 && (
                    <img
                      src={v.fotos[0]}
                      alt={v.modelo}
                      className="w-16 h-10 object-cover rounded mt-2 ml-auto"
                    />
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
