/**
 * A5 – AlertasValor
 * Banner de alertas de valorização/desvalorização significativa.
 */
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { useState } from 'react';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculos: Veiculo[];
  onSelectVeiculo?: (v: Veiculo) => void;
}

const THRESHOLD = 0.05; // 5% diferença

export default function AlertasValor({ veiculos, onSelectVeiculo }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alertas = veiculos
    .filter(v => {
      if (dismissed.has(v.id)) return false;
      if (v.valorFipe === 0) return false;
      const diff = Math.abs(v.valorMercado - v.valorFipe) / v.valorFipe;
      return diff >= THRESHOLD;
    })
    .map(v => {
      const diff = v.valorMercado - v.valorFipe;
      const diffPct = (diff / v.valorFipe) * 100;
      return { veiculo: v, diff, diffPct };
    })
    .sort((a, b) => Math.abs(b.diffPct) - Math.abs(a.diffPct))
    .slice(0, 3);

  if (alertas.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in-up">
      {alertas.map(({ veiculo, diff, diffPct }) => {
        const positivo = diff >= 0;
        return (
          <div
            key={veiculo.id}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: positivo ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: positivo ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {positivo
                ? <TrendingUp className="w-4 h-4 shrink-0" style={{ color: 'var(--color-success)' }} />
                : <TrendingDown className="w-4 h-4 shrink-0" style={{ color: 'var(--color-danger)' }} />
              }
              <div className="min-w-0">
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {veiculo.modelo}
                </span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                  Mercado {positivo ? 'acima' : 'abaixo'} da FIPE em{' '}
                  <strong style={{ color: positivo ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {Math.abs(diffPct).toFixed(1)}% ({formatCurrency(Math.abs(diff))})
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onSelectVeiculo && (
                <button
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-primary-muted)' }}
                  onClick={() => onSelectVeiculo(veiculo)}
                >
                  Ver
                </button>
              )}
              <button
                onClick={() => setDismissed(prev => new Set([...prev, veiculo.id]))}
                className="p-1 rounded"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
