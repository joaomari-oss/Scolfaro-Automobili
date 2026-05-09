import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculos: Veiculo[];
  colorMap: Record<string, string>;
}

export default function DistribuicaoPanel({ veiculos, colorMap }: Props) {
  const total = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const sorted = [...veiculos].sort((a, b) => b.valorMercado - a.valorMercado);

  if (veiculos.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-6 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          Distribuição do Acervo Completo
        </h2>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
          Valor total:{' '}
          <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
            {formatCurrency(total)}
          </span>
          {' · '}{veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 32,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          gap: 2,
          marginBottom: 16,
        }}
      >
        {sorted.map(v => (
          <div
            key={v.id}
            title={`${v.modelo}: ${formatCurrency(v.valorMercado)} (${total > 0 ? ((v.valorMercado / total) * 100).toFixed(1) : 0}%)`}
            style={{
              flex: total > 0 ? v.valorMercado / total : 1 / veiculos.length,
              backgroundColor: colorMap[v.id] ?? '#888',
              minWidth: 4,
              cursor: 'default',
            }}
          />
        ))}
      </div>

      {/* Vehicle list */}
      <div
        style={{
          maxHeight: sorted.length > 8 ? 320 : undefined,
          overflowY: sorted.length > 8 ? 'auto' : undefined,
        }}
      >
        {sorted.map(v => {
          const pct = total > 0 ? (v.valorMercado / total) * 100 : 0;
          return (
            <div
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {/* Colored dot */}
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: colorMap[v.id] ?? '#888',
                  flexShrink: 0,
                }}
              />
              {/* Model name */}
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.modelo}
              </span>
              {/* Value */}
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {formatCurrency(v.valorMercado)}
              </span>
              {/* Percentage */}
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  width: 52,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {pct.toFixed(1)}%
              </span>
              {/* Mini bar */}
              <div
                style={{
                  width: 64,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'var(--bg-tertiary)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: '100%',
                    backgroundColor: colorMap[v.id] ?? '#888',
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
