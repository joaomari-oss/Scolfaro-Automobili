import { useState, useMemo, useEffect } from 'react';
import { RefreshCw, TrendingUp, DollarSign, BarChart2, ArrowUp, ArrowDown, X } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import { formatCurrency, formatKm, formatDate } from '../utils/formatters';
import { buildColorMap } from '../utils/vehicleColors';
import BarrasChart from '../components/Charts/BarrasChart';
import DonutChart from '../components/Charts/DonutChart';
import DistribuicaoPanel from '../components/Charts/DistribuicaoPanel';
import VeiculoSeletor from '../components/Charts/VeiculoSeletor';
import { useIA } from '../hooks/useIA';
import { showToast } from '../components/Layout/Toast';

const SELECTION_KEY = 'scolfaro-automobili-chart-selection';
const DISMISS_KEY   = 'scolfaro-automobili-outdated-dismissed';
const OUTDATED_DAYS = 30;
const DISMISS_DAYS  = 7;

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  onUpdateVeiculo: (id: string, data: Partial<Veiculo>) => void;
}

type SortKey = 'modelo' | 'ano' | 'km' | 'mercado' | 'fipe' | 'diffR' | 'diffP' | 'data';

export default function Valores({ veiculos, theme, onUpdateVeiculo }: Props) {
  const { buscarValores } = useIA();

  // ── Existing state ────────────────────────────────────────────────────────
  const [atualizando, setAtualizando] = useState(false);
  const [progresso, setProgresso] = useState({ current: 0, total: 0 });
  const [sortKey, setSortKey] = useState<SortKey>('mercado');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Vehicle selection state ────────────────────────────────────────────────
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);

  // Initialize selection from localStorage once vehicles load
  useEffect(() => {
    if (veiculos.length === 0 || selectionReady) return;
    const stored = localStorage.getItem(SELECTION_KEY);
    let ids: string[];
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        const valid = parsed.filter(id => veiculos.some(v => v.id === id));
        ids = valid.length > 0 ? valid : veiculos.slice(0, 5).map(v => v.id);
      } catch {
        ids = veiculos.slice(0, 5).map(v => v.id);
      }
    } else {
      ids = veiculos.slice(0, 5).map(v => v.id);
    }
    setSelectedVehicleIds(ids);
    setSelectionReady(true);
  }, [veiculos, selectionReady]);

  // Persist selection changes
  useEffect(() => {
    if (!selectionReady || selectedVehicleIds.length === 0) return;
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selectedVehicleIds));
  }, [selectedVehicleIds, selectionReady]);

  // ── Outdated banner ────────────────────────────────────────────────────────
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    const dismissedAt = new Date(stored);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DISMISS_DAYS);
    return dismissedAt > cutoff;
  });

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  };

  // ── Totals (always from full acervo) ──────────────────────────────────────
  const totalMercado = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const totalFipe    = veiculos.reduce((s, v) => s + v.valorFipe, 0);
  const diffTotal    = totalMercado - totalFipe;

  const carroMaisValioso = veiculos.length > 0
    ? veiculos.reduce((best, v) => v.valorMercado > best.valorMercado ? v : best)
    : null;

  const ultimaAtualizacao = veiculos.length > 0
    ? veiculos.reduce((latest, v) => v.ultimaAtualizacao > latest ? v.ultimaAtualizacao : latest, veiculos[0].ultimaAtualizacao)
    : '';

  // ── Color map (consistent across all charts) ──────────────────────────────
  const colorMap = useMemo(() => buildColorMap(veiculos, theme), [veiculos, theme]);

  // ── Filtered vehicles for charts & table ──────────────────────────────────
  const selectedVeiculos = useMemo(
    () => veiculos.filter(v => selectedVehicleIds.includes(v.id)),
    [veiculos, selectedVehicleIds],
  );

  // ── Outdated vehicles (> 30 days since last update) ───────────────────────
  const outdatedVehicles = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - OUTDATED_DAYS);
    return veiculos.filter(v => new Date(v.ultimaAtualizacao) < cutoff);
  }, [veiculos]);

  const showOutdatedBanner = outdatedVehicles.length > 0 && !bannerDismissed;

  // ── Selection handlers ────────────────────────────────────────────────────
  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev => {
      if (prev.includes(id)) {
        return prev.length <= 1 ? prev : prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const selectAll  = () => setSelectedVehicleIds(veiculos.map(v => v.id));
  const clearAll   = () => {
    if (veiculos.length > 0) setSelectedVehicleIds([veiculos[0].id]);
  };

  // ── Update all via AI ─────────────────────────────────────────────────────
  const handleAtualizarTodos = async () => {
    setAtualizando(true);
    setProgresso({ current: 0, total: veiculos.length });

    for (let i = 0; i < veiculos.length; i++) {
      const v = veiculos[i];
      setProgresso({ current: i + 1, total: veiculos.length });
      try {
        const result = await buscarValores({
          modelo: v.modelo, marca: v.marca, ano: v.ano,
          quilometragem: v.quilometragem, combustivel: v.combustivel,
        });
        if (result) {
          const hoje = new Date().toISOString().split('T')[0];
          onUpdateVeiculo(v.id, {
            valorMercado: result.valorMercado,
            valorFipe: result.valorFipe,
            ultimaAtualizacao: hoje,
            historicovalorizacao: [
              ...v.historicovalorizacao,
              { data: hoje, valorMercado: result.valorMercado, valorFipe: result.valorFipe, fonte: 'IA Scolfaro' },
            ],
          });
        }
      } catch {
        showToast('error', `Falha ao atualizar ${v.modelo}`);
      }
    }
    setAtualizando(false);
    setBannerDismissed(false); // re-check after update
    showToast('success', 'Todos os valores foram atualizados!');
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const tabelaData = useMemo(() => {
    const rows = selectedVeiculos.map(v => ({
      ...v,
      diffR: v.valorMercado - v.valorFipe,
      diffP: v.valorFipe > 0 ? ((v.valorMercado - v.valorFipe) / v.valorFipe) * 100 : 0,
    }));

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'modelo':  cmp = a.modelo.localeCompare(b.modelo); break;
        case 'ano':     cmp = a.ano - b.ano; break;
        case 'km':      cmp = a.quilometragem - b.quilometragem; break;
        case 'mercado': cmp = a.valorMercado - b.valorMercado; break;
        case 'fipe':    cmp = a.valorFipe - b.valorFipe; break;
        case 'diffR':   cmp = a.diffR - b.diffR; break;
        case 'diffP':   cmp = a.diffP - b.diffP; break;
        case 'data':    cmp = a.ultimaAtualizacao.localeCompare(b.ultimaAtualizacao); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [selectedVeiculos, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="opacity-20">↕</span>;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 inline-block ml-1" />
      : <ArrowDown className="w-3 h-3 inline-block ml-1" />;
  };

  const ChartWrapper = ({ title, children, height = 'h-72' }: { title: string; children: React.ReactNode; height?: string }) => (
    <div
      className="rounded-xl border p-6 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <h2 className="font-display font-bold text-base mb-5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div className={height}>{children}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Page header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Painel de Valores
        </h1>
        {ultimaAtualizacao && (
          <p className="font-data text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Última atualização: {formatDate(ultimaAtualizacao)}
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card accent-card animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="sa-label text-[10px] uppercase tracking-widest">Total Mercado</span>
          </div>
          <p className="font-data font-medium text-2xl" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(totalMercado)}
          </p>
        </div>

        <div className="kpi-card animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
            <span className="sa-label text-[10px] uppercase tracking-widest">Total FIPE</span>
          </div>
          <p className="font-data font-medium text-2xl" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalFipe)}
          </p>
        </div>

        <div className="kpi-card animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4" style={{ color: diffTotal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
            <span className="sa-label text-[10px] uppercase tracking-widest">Mercado vs FIPE</span>
          </div>
          <p
            className="font-data font-medium text-2xl"
            style={{ color: diffTotal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {diffTotal >= 0 ? '+' : ''}{formatCurrency(diffTotal)}
          </p>
        </div>

        <div className="kpi-card animate-fade-in-up stagger-4 flex flex-col justify-between">
          {carroMaisValioso && (
            <div className="mb-3">
              <p className="sa-label text-[10px] uppercase tracking-widest mb-1">Mais Valioso</p>
              <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {carroMaisValioso.modelo}
              </p>
              <p className="font-data text-xs" style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(carroMaisValioso.valorMercado)}
              </p>
            </div>
          )}
          <button
            onClick={handleAtualizarTodos}
            disabled={atualizando || veiculos.length === 0}
            className="sa-btn-primary py-2 text-sm w-full justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
            {atualizando ? `${progresso.current}/${progresso.total}` : 'Atualizar via IA'}
          </button>
          {atualizando && (
            <div className="mt-2 w-full rounded-full h-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(progresso.current / progresso.total) * 100}%`,
                  backgroundColor: 'var(--accent-primary)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Outdated values banner */}
      {showOutdatedBanner && (
        <div
          className="animate-fade-in-up"
          style={{
            background: 'var(--accent-primary-muted)',
            border: '1px solid var(--accent-primary-border, var(--accent-primary))',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}>
            🔄 {outdatedVehicles.length} veículo{outdatedVehicles.length !== 1 ? 's' : ''} com valores desatualizados ({'>'}30 dias)
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleAtualizarTodos}
              disabled={atualizando}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 13,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                cursor: atualizando ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              {atualizando ? 'Atualizando...' : 'Atualizar todos agora'}
            </button>
            <button
              onClick={dismissBanner}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              title="Ignorar por 7 dias"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {veiculos.length > 0 && (
        <>
          {/* Distribution panel — always all vehicles */}
          <DistribuicaoPanel veiculos={veiculos} colorMap={colorMap} />

          {/* Vehicle selector */}
          {selectionReady && (
            <VeiculoSeletor
              veiculos={veiculos}
              selectedIds={selectedVehicleIds}
              colorMap={colorMap}
              onToggle={toggleVehicle}
              onSelectAll={selectAll}
              onClearAll={clearAll}
            />
          )}

          {/* Charts — respond to selection */}
          {selectionReady && selectedVeiculos.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartWrapper title="Valor de Mercado por Veículo">
                  <BarrasChart veiculos={selectedVeiculos} theme={theme} mode="single" colorMap={colorMap} />
                </ChartWrapper>
                <ChartWrapper title="Distribuição dos Selecionados" height="h-72">
                  <DonutChart veiculos={selectedVeiculos} theme={theme} colorMap={colorMap} />
                </ChartWrapper>
              </div>

              <ChartWrapper title="FIPE vs Mercado por Veículo">
                <BarrasChart veiculos={selectedVeiculos} theme={theme} mode="grouped" colorMap={colorMap} />
              </ChartWrapper>

              {/* Comparison table */}
              <div
                className="rounded-xl border overflow-hidden animate-fade-in-up"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
              >
                <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    Tabela Comparativa
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full sa-table">
                    <thead>
                      <tr>
                        {[
                          { k: 'modelo' as SortKey, label: 'Veículo',  align: 'left' },
                          { k: 'ano'    as SortKey, label: 'Ano',      align: 'right' },
                          { k: 'km'     as SortKey, label: 'Km',       align: 'right' },
                          { k: 'mercado'as SortKey, label: 'Mercado',  align: 'right' },
                          { k: 'fipe'   as SortKey, label: 'FIPE',     align: 'right' },
                          { k: 'diffR'  as SortKey, label: 'Dif. R$',  align: 'right' },
                          { k: 'diffP'  as SortKey, label: 'Dif. %',   align: 'right' },
                          { k: 'data'   as SortKey, label: 'Data',     align: 'right' },
                        ].map(col => (
                          <th
                            key={col.k}
                            onClick={() => toggleSort(col.k)}
                            style={{ textAlign: col.align as 'left' | 'right' }}
                          >
                            {col.label} <SortIcon k={col.k} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tabelaData.map((v, i) => (
                        <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: colorMap[v.id] ?? 'var(--text-muted)',
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                  {v.modelo}
                                </p>
                                <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {v.marca}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right font-data text-sm" style={{ color: 'var(--text-secondary)' }}>{v.ano}</td>
                          <td className="text-right font-data text-sm" style={{ color: 'var(--text-secondary)' }}>{formatKm(v.quilometragem)}</td>
                          <td className="text-right font-data font-medium text-sm" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(v.valorMercado)}</td>
                          <td className="text-right font-data text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(v.valorFipe)}</td>
                          <td className="text-right font-data text-sm" style={{ color: v.diffR >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {v.diffR >= 0 ? '+' : ''}{formatCurrency(v.diffR)}
                          </td>
                          <td className="text-right font-data text-sm" style={{ color: v.diffP >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {v.diffP >= 0 ? '+' : ''}{v.diffP.toFixed(1)}%
                          </td>
                          <td className="text-right font-data text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(v.ultimaAtualizacao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer — totals always from full acervo */}
                    <tfoot>
                      <tr style={{ backgroundColor: 'var(--accent-primary-muted)', borderTop: '1px solid var(--accent-primary-border, var(--accent-primary))' }}>
                        <td colSpan={3} className="px-4 py-3">
                          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Total acervo ({veiculos.length} veículos)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-data font-bold text-sm" style={{ color: 'var(--accent-primary)' }}>
                          {formatCurrency(totalMercado)}
                        </td>
                        <td className="px-4 py-3 text-right font-data font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(totalFipe)}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-data font-bold text-sm"
                          style={{ color: diffTotal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                        >
                          {diffTotal >= 0 ? '+' : ''}{formatCurrency(diffTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-data font-bold text-sm"
                          style={{ color: diffTotal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {totalFipe > 0 ? `${((diffTotal / totalFipe) * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {selectedVeiculos.length < veiculos.length && (
                  <p
                    className="px-6 pb-4 pt-2"
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    * Total refere-se ao acervo completo de {veiculos.length} veículos
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {veiculos.length === 0 && (
        <div className="empty-state animate-fade-in">
          <BarChart2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            Nenhum dado disponível
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Adicione veículos ao acervo para ver o painel de valores
          </p>
        </div>
      )}
    </div>
  );
}
