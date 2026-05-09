/**
 * A2 – DepreciacaoChart
 * Calculadora de depreciação projetada a 5 anos.
 */
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculo: Veiculo;
  theme: 'dark' | 'light';
}

// Taxas médias de depreciação anual por tipo
const TAXAS: Record<string, number> = {
  esportivo: 0.07,
  classico: -0.05, // valoriza
  suv: 0.12,
  sedan: 0.14,
  hatch: 0.15,
  picape: 0.10,
  conversivel: 0.08,
  moto: 0.15,
  van: 0.13,
  utilitario: 0.12,
};

export default function DepreciacaoChart({ veiculo, theme }: Props) {
  const isDark = theme === 'dark';
  const accentColor = isDark ? '#F5C400' : '#1D4ED8';
  const tickColor = isDark ? '#5A5A5A' : '#A3A3A3';

  const taxa = TAXAS[veiculo.tipo] ?? 0.12;
  const anoAtual = new Date().getFullYear();

  const data = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ano = anoAtual + i;
      const valorProjetado = veiculo.valorMercado * Math.pow(1 - taxa, i);
      const valorFipeProj = veiculo.valorFipe * Math.pow(1 - taxa * 0.9, i);
      return {
        ano: String(ano),
        Mercado: Math.round(valorProjetado),
        FIPE: Math.round(valorFipeProj),
      };
    });
  }, [veiculo, taxa, anoAtual]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Taxa estimada:</span>
          <strong style={{ color: taxa < 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {taxa < 0 ? '+' : '-'}{(Math.abs(taxa) * 100).toFixed(0)}%/ano
          </strong>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Valor em 5 anos:</span>
          <strong style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(data[5]?.Mercado ?? 0)}
          </strong>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2A2A2A' : '#F0F0F0'} />
            <XAxis dataKey="ano" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                borderColor: isDark ? '#2A2A2A' : '#E4E4E7',
                borderRadius: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: isDark ? '#F0F0F0' : '#0F0F0F',
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Mercado" stroke={accentColor} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="FIPE" stroke={isDark ? '#3B82F6' : '#2563EB'} strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
        * Projeção estimada baseada em médias históricas do segmento {veiculo.tipo}. Não é garantia de valor futuro.
      </p>
    </div>
  );
}
