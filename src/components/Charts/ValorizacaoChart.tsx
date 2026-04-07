import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HistoricoValor } from '../../types/veiculo';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  historico: HistoricoValor[];
  theme: 'dark' | 'light';
}

export default function ValorizacaoChart({ historico, theme }: Props) {
  const isDark = theme === 'dark';
  const tickColor   = isDark ? '#5A5A5A' : '#A3A3A3';
  const accentColor = isDark ? '#F5C400' : '#1D4ED8';
  const blueColor   = isDark ? '#3B82F6' : '#2563EB';

  const data = historico.map(h => ({
    data: formatDate(h.data),
    Mercado: h.valorMercado,
    FIPE: h.valorFipe,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="valGradMercado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="valGradFipe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={blueColor} stopOpacity={0.15} />
            <stop offset="95%" stopColor={blueColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="data" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          axisLine={false}
          tickLine={false}
        />
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
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif' }} />
        <Area type="monotone" dataKey="Mercado" stroke={accentColor} strokeWidth={2} fill="url(#valGradMercado)" dot={{ r: 3, fill: accentColor }} />
        <Area type="monotone" dataKey="FIPE"    stroke={blueColor}   strokeWidth={2} fill="url(#valGradFipe)"   dot={{ r: 3, fill: blueColor }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
