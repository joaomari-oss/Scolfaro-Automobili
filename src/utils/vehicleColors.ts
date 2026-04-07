export const VEHICLE_COLORS_DARK = [
  '#F5C400', '#FF8C00', '#FF4B4B', '#A855F7', '#22C55E',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6',
  '#06B6D4', '#84CC16',
];

export const VEHICLE_COLORS_LIGHT = [
  '#1D4ED8', '#0891B2', '#059669', '#7C3AED', '#DC2626',
  '#D97706', '#DB2777', '#0F766E', '#EA580C', '#4F46E5',
  '#0369A1', '#166534',
];

export function buildColorMap(
  veiculos: { id: string }[],
  theme: 'dark' | 'light',
): Record<string, string> {
  const colors = theme === 'dark' ? VEHICLE_COLORS_DARK : VEHICLE_COLORS_LIGHT;
  const map: Record<string, string> = {};
  veiculos.forEach((v, i) => {
    map[v.id] = colors[i % colors.length];
  });
  return map;
}
