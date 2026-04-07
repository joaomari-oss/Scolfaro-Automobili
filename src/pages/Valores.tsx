import { useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, DollarSign, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import { formatCurrency, formatKm, formatDate } from '../utils/formatters';
import BarrasChart from '../components/Charts/BarrasChart';
import DonutChart from '../components/Charts/DonutChart';
import { useIA } from '../hooks/useIA';
import { showToast } from '../components/Layout/Toast';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  onUpdateVeiculo: (id: string, data: Partial<Veiculo>) => void;
}

type SortKey = 'modelo' | 'ano' | 'km' | 'mercado' | 'fipe' | 'diffR' | 'diffP' | 'data';

export default function Valores({ veiculos, theme, onUpdateVeiculo }: Props) {
  const { buscarValores } = useIA();
  const [atualizando, setAtualizando] = useState(false);
  const [progresso, setProgresso] = useState({ current: 0, total: 0 });
  const [sortKey, setSortKey] = useState<SortKey>('mercado');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const totalMercado = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const totalFipe    = veiculos.reduce((s, v) => s + v.valorFipe, 0);
  const diffTotal    = totalMercado - totalFipe;

  const carroMaisValioso = veiculos.length > 0
    ? veiculos.reduce((best, v) => v.valorMercado > best.valorMercado ? v : best)
    : null;

  const ultimaAtualizacao = veiculos.length > 0
    ? veiculos.reduce((latest, v) => v.ultimaAtualizacao > latest ? v.ultimaAtualizacao : latest, veiculos[0].ultimaAtualizacao)
    : '';

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
    showToast('success', 'Todos os valores foram atualizados!');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const tabelaData = useMemo(() => {
    const rows = veiculos.map(v => ({
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
  }, [veiculos, sortKey, sortDir]);

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
        {/* Total Mercado */}
        <div className="kpi-card accent-card animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="sa-label text-[10px] uppercase tracking-widest">Total Mercado</span>
          </div>
          <p className="font-data font-medium text-2xl" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(totalMercado)}
          </p>
        </div>

        {/* Total FIPE */}
        <div className="kpi-card animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
            <span className="sa-label text-[10px] uppercase tracking-widest">Total FIPE</span>
          </div>
          <p className="font-data font-medium text-2xl" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(totalFipe)}
          </p>
        </div>

        {/* Diferença total */}
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

        {/* Atualizar + mais valioso */}
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

      {veiculos.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWrapper title="Valor de Mercado por Veículo">
              <BarrasChart veiculos={veiculos} theme={theme} mode="single" />
            </ChartWrapper>
            <ChartWrapper title="Distribuição do Valor Total" height="h-72">
              <DonutChart veiculos={veiculos} theme={theme} />
            </ChartWrapper>
          </div>

          <ChartWrapper title="FIPE vs Mercado por Veículo">
            <BarrasChart veiculos={veiculos} theme={theme} mode="grouped" />
          </ChartWrapper>

          {/* Table */}
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
                      { k: 'modelo' as SortKey, label: 'Veículo', align: 'left' },
                      { k: 'ano'    as SortKey, label: 'Ano',     align: 'right' },
                      { k: 'km'     as SortKey, label: 'Km',      align: 'right' },
                      { k: 'mercado'as SortKey, label: 'Mercado', align: 'right' },
                      { k: 'fipe'   as SortKey, label: 'FIPE',    align: 'right' },
                      { k: 'diffR'  as SortKey, label: 'Dif. R$', align: 'right' },
                      { k: 'diffP'  as SortKey, label: 'Dif. %',  align: 'right' },
                      { k: 'data'   as SortKey, label: 'Data',    align: 'right' },
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
                        <div>
                          <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {v.modelo}
                          </p>
                          <p className="font-data text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {v.marca}
                          </p>
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
                {/* Footer total */}
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--accent-primary-muted)', borderTop: '1px solid var(--accent-primary-border)' }}>
                    <td colSpan={3} className="px-4 py-3">
                      <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Total ({veiculos.length} veículos)
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
          </div>
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
