import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Car, SlidersHorizontal, X, Download } from 'lucide-react';
import type { Veiculo, TipoVeiculo } from '../types/veiculo';
import VeiculoCard from '../components/Cards/VeiculoCard';
import FiltrosAcervo, { type Filtros, filtrosVazios } from '../components/Filters/FiltrosAcervo';
import { SkeletonGrid } from '../components/Layout/SkeletonCard';
import { exportarCSV } from '../utils/exportCSV';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  loading?: boolean;
  onSelectVeiculo: (v: Veiculo) => void;
  onToggleFavorito: (id: string) => void;
  onRemove: (v: Veiculo) => void;
}

export default function Acervo({ veiculos, theme, loading, onSelectVeiculo, onToggleFavorito, onRemove }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const initialTipo = searchParams.get('tipo') as TipoVeiculo | null;

  const [filtros, setFiltros] = useState<Filtros>({
    ...filtrosVazios,
    tipos: initialTipo ? [initialTipo] : [],
  });

  const [sortKey, setSortKey] = useState<'recente' | 'preco_asc' | 'preco_desc' | 'km_asc' | 'az'>('recente');

  const marcasDisponiveis = useMemo(
    () => [...new Set(veiculos.map(v => v.marca))].sort(),
    [veiculos]
  );

  const filtrados = useMemo(() => {
    let arr = veiculos.filter(v => {
      if (filtros.marcas.length > 0 && !filtros.marcas.includes(v.marca)) return false;
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(v.tipo)) return false;
      if (filtros.anoMin && v.ano < filtros.anoMin) return false;
      if (filtros.anoMax && v.ano > filtros.anoMax) return false;
      if (filtros.precoMin && v.valorMercado < filtros.precoMin) return false;
      if (filtros.precoMax && v.valorMercado > filtros.precoMax) return false;
      if (filtros.kmMax && v.quilometragem > filtros.kmMax) return false;
      return true;
    });

    switch (sortKey) {
      case 'preco_asc':  arr = arr.sort((a, b) => a.valorMercado - b.valorMercado); break;
      case 'preco_desc': arr = arr.sort((a, b) => b.valorMercado - a.valorMercado); break;
      case 'km_asc':     arr = arr.sort((a, b) => a.quilometragem - b.quilometragem); break;
      case 'az':         arr = arr.sort((a, b) => a.modelo.localeCompare(b.modelo)); break;
      default: break;
    }

    return arr;
  }, [veiculos, filtros, sortKey]);

  const activeFilterCount =
    filtros.marcas.length + filtros.tipos.length +
    (filtros.anoMin ? 1 : 0) + (filtros.anoMax ? 1 : 0) +
    (filtros.precoMin ? 1 : 0) + (filtros.precoMax ? 1 : 0) +
    (filtros.kmMax ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="animate-fade-in-up">
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Acervo Completo
          </h1>
          <p className="font-data text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtrados.length} de {veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 animate-fade-in-up stagger-1">
          {/* Sort */}
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as typeof sortKey)}
            className="sa-select py-2 text-sm"
            style={{ width: 'auto', paddingRight: '32px', minWidth: '150px' }}
          >
            <option value="recente">Mais recente</option>
            <option value="preco_desc">Maior preço</option>
            <option value="preco_asc">Menor preço</option>
            <option value="km_asc">Menor km</option>
            <option value="az">A–Z</option>
          </select>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 sa-btn-ghost py-2 px-3"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span
                className="w-4 h-4 rounded-full font-data text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Add vehicle button */}
          <button onClick={() => exportarCSV(filtrados, 'acervo_scolfaro')} className="sa-btn-ghost py-2" title="Exportar CSV">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={() => navigate('/adicionar')} className="sa-btn-primary py-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── SIDEBAR FILTERS (desktop) ── */}
        <aside
          className="hidden lg:block w-72 shrink-0 self-start sticky top-20 rounded-xl border p-5 animate-fade-in-up stagger-1"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <FiltrosAcervo
            filtros={filtros}
            onChange={setFiltros}
            marcasDisponiveis={marcasDisponiveis}
            theme={theme}
          />
        </aside>

        {/* ── MOBILE FILTERS OVERLAY ── */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div
              className="relative ml-auto h-full w-80 max-w-full overflow-y-auto p-5 animate-slide-right"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Filtros</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Fechar filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltrosAcervo filtros={filtros} onChange={setFiltros} marcasDisponiveis={marcasDisponiveis} theme={theme} />
            </div>
          </div>
        )}

        {/* ── GRID ── */}
        <div className="flex-1">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : filtrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtrados.map((v, i) => (
                <div key={v.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}>
                  <VeiculoCard
                    veiculo={v}
                    theme={theme}
                    onOpen={onSelectVeiculo}
                    onToggleFavorito={onToggleFavorito}
                    onRemove={onRemove}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state animate-fade-in">
              <Car className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                Nenhum veículo encontrado
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {activeFilterCount > 0
                  ? 'Tente ajustar ou limpar os filtros aplicados'
                  : 'Adicione seu primeiro veículo ao acervo'
                }
              </p>
              {activeFilterCount > 0 ? (
                <button onClick={() => setFiltros(filtrosVazios)} className="sa-btn-ghost text-sm">
                  Limpar filtros
                </button>
              ) : (
                <button onClick={() => navigate('/adicionar')} className="sa-btn-primary text-sm py-2">
                  <Plus className="w-4 h-4" />
                  Adicionar veículo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
