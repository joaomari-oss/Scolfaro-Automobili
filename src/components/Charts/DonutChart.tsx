import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

const COLORS_DARK  = ['#F5C400', '#FF8C00', '#FF4B4B', '#A855F7', '#22C55E', '#3B82F6', '#EC4899', '#14B8A6', '#84CC16', '#F97316'];
const COLORS_LIGHT = ['#1D4ED8', '#0891B2', '#059669', '#7C3AED', '#DC2626', '#D97706', '#DB2777', '#0F766E', '#4F46E5', '#B45309'];

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
}

export default function DonutChart({ veiculos, theme }: Props) {
  const isDark = theme === 'dark';
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
  const total = veiculos.reduce((s, v) => s + v.valorMercado, 0);

  const data = veiculos.map(v => ({
    name: v.modelo,
    value: v.valorMercado,
    pct: total > 0 ? ((v.valorMercado / total) * 100).toFixed(1) : '0',
  }));

  const tooltipStyle = {
    backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
    borderColor:     isDark ? '#2A2A2A' : '#E4E4E7',
    borderRadius:    '10px',
    fontFamily:      'JetBrains Mono, monospace',
    fontSize:        12,
    color:           isDark ? '#F0F0F0' : '#0F0F0F',
  };

  const renderLabel = (props: PieLabelRenderProps & { pct?: string }) => `${props.pct ?? ''}%`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="42%"
          outerRadius="68%"
          dataKey="value"
          label={renderLabel}
          labelLine={false}
          strokeWidth={2}
          stroke={isDark ? '#111111' : '#FAFAFA'}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: isDark ? '#A0A0A0' : '#525252', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
