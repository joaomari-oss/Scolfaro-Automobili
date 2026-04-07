import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

const COLORS_DARK  = ['#F5C400', '#FF8C00', '#FF4B4B', '#A855F7', '#22C55E', '#3B82F6', '#EC4899', '#14B8A6', '#84CC16', '#F97316'];
const COLORS_LIGHT = ['#1D4ED8', '#0891B2', '#059669', '#7C3AED', '#DC2626', '#D97706', '#DB2777', '#0F766E', '#4F46E5', '#B45309'];

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  mode?: 'single' | 'grouped';
  colorMap?: Record<string, string>;
}

export default function BarrasChart({ veiculos, theme, mode = 'single', colorMap }: Props) {
  const isDark = theme === 'dark';
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
  const tickColor   = isDark ? '#5A5A5A' : '#A3A3A3';
  const accentColor = isDark ? '#F5C400' : '#1D4ED8';
  const blueColor   = isDark ? '#3B82F6' : '#2563EB';

  const data = veiculos.map(v => ({
    id: v.id,
    nome: v.modelo.length > 16 ? v.modelo.slice(0, 16) + '…' : v.modelo,
    full: v.modelo,
    Mercado: v.valorMercado,
    FIPE: v.valorFipe,
  }));

  const tooltipStyle = {
    backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
    borderColor:     isDark ? '#2A2A2A' : '#E4E4E7',
    borderRadius:    '10px',
    fontFamily:      'JetBrains Mono, monospace',
    fontSize:        12,
    color:           isDark ? '#F0F0F0' : '#0F0F0F',
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ bottom: 20 }}>
        <XAxis
          dataKey="nome"
          tick={{ fontSize: 11, fill: tickColor, fontFamily: 'DM Sans, sans-serif' }}
          angle={-20}
          textAnchor="end"
          axisLine={{ stroke: isDark ? '#2A2A2A' : '#E4E4E7' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor, fontFamily: 'DM Sans, sans-serif' }}
          tickFormatter={v => `${(v / 1000000).toFixed(1)}M`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ''}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif', paddingTop: 8 }} />
        {mode === 'single' ? (
          <Bar dataKey="Mercado" radius={[6, 6, 0, 0]}>
            {data.map((item, i) => (
              <Cell key={i} fill={colorMap?.[item.id] ?? COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        ) : (
          <>
            <Bar dataKey="FIPE"    fill={blueColor}   radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mercado" fill={accentColor}  radius={[4, 4, 0, 0]} />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
