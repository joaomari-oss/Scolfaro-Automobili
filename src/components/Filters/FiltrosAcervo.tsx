import { X } from 'lucide-react';
import type { TipoVeiculo } from '../../types/veiculo';
import { categoriaLabels, categoriaSilhouettes } from '../Cards/CategoriaCard';

export interface Filtros {
  marcas: string[];
  tipos: TipoVeiculo[];
  anoMin: number | null;
  anoMax: number | null;
  precoMin: number | null;
  precoMax: number | null;
  kmMax: number | null;
}

export const filtrosVazios: Filtros = {
  marcas: [],
  tipos: [],
  anoMin: null,
  anoMax: null,
  precoMin: null,
  precoMax: null,
  kmMax: null,
};

interface Props {
  filtros: Filtros;
  onChange: (f: Filtros) => void;
  marcasDisponiveis: string[];
  theme: 'dark' | 'light';
}

export default function FiltrosAcervo({ filtros, onChange, marcasDisponiveis }: Props) {
  const toggleMarca = (m: string) => {
    const marcas = filtros.marcas.includes(m)
      ? filtros.marcas.filter(x => x !== m)
      : [...filtros.marcas, m];
    onChange({ ...filtros, marcas });
  };

  const toggleTipo = (t: TipoVeiculo) => {
    const tipos = filtros.tipos.includes(t)
      ? filtros.tipos.filter(x => x !== t)
      : [...filtros.tipos, t];
    onChange({ ...filtros, tipos });
  };

  const activeCount =
    filtros.marcas.length +
    filtros.tipos.length +
    (filtros.anoMin ? 1 : 0) +
    (filtros.anoMax ? 1 : 0) +
    (filtros.precoMin ? 1 : 0) +
    (filtros.precoMax ? 1 : 0) +
    (filtros.kmMax ? 1 : 0);

  const allTipos: TipoVeiculo[] = ['sedan', 'suv', 'esportivo', 'hatch', 'picape', 'conversivel', 'moto', 'van', 'utilitario', 'classico'];

  const precoAtalhos = [
    { label: 'Até 100k', min: null, max: 100000 },
    { label: '100k–300k', min: 100000, max: 300000 },
    { label: '300k–1M', min: 300000, max: 1000000 },
    { label: 'Acima 1M', min: 1000000, max: null },
  ];

  const kmAtalhos = [
    { label: 'Até 10k km', value: 10000 },
    { label: 'Até 50k km', value: 50000 },
    { label: 'Até 100k km', value: 100000 },
  ];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="sa-label uppercase tracking-widest text-[10px] mb-2.5">{children}</p>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Filtros
          </h3>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full font-data text-xs font-bold"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(filtrosVazios)}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--color-danger)' }}
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* Marca */}
      {marcasDisponiveis.length > 0 && (
        <div>
          <SectionTitle>Marca</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {marcasDisponiveis.map(m => (
              <button
                key={m}
                onClick={() => toggleMarca(m)}
                className={`sa-chip ${filtros.marcas.includes(m) ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tipo */}
      <div>
        <SectionTitle>Tipo de Veículo</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {allTipos.map(t => (
            <button
              key={t}
              onClick={() => toggleTipo(t)}
              className={`sa-chip ${filtros.tipos.includes(t) ? 'active' : ''}`}
            >
              <div className="w-5 h-3 shrink-0">{categoriaSilhouettes[t]}</div>
              {categoriaLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Ano */}
      <div>
        <SectionTitle>Ano</SectionTitle>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="De"
            value={filtros.anoMin ?? ''}
            onChange={e => onChange({ ...filtros, anoMin: e.target.value ? Number(e.target.value) : null })}
            className="sa-input py-2 text-sm"
            style={{ width: '88px' }}
          />
          <input
            type="number"
            placeholder="Até"
            value={filtros.anoMax ?? ''}
            onChange={e => onChange({ ...filtros, anoMax: e.target.value ? Number(e.target.value) : null })}
            className="sa-input py-2 text-sm"
            style={{ width: '88px' }}
          />
        </div>
      </div>

      {/* Preço */}
      <div>
        <SectionTitle>Faixa de Preço</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {precoAtalhos.map(a => {
            const isActive = filtros.precoMin === a.min && filtros.precoMax === a.max;
            return (
              <button
                key={a.label}
                onClick={() => isActive
                  ? onChange({ ...filtros, precoMin: null, precoMax: null })
                  : onChange({ ...filtros, precoMin: a.min, precoMax: a.max })
                }
                className={`sa-chip text-[11px] ${isActive ? 'active' : ''}`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quilometragem */}
      <div>
        <SectionTitle>Quilometragem</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {kmAtalhos.map(a => {
            const isActive = filtros.kmMax === a.value;
            return (
              <button
                key={a.label}
                onClick={() => onChange({ ...filtros, kmMax: isActive ? null : a.value })}
                className={`sa-chip text-[11px] ${isActive ? 'active' : ''}`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
