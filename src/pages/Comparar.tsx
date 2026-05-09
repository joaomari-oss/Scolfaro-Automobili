/**
 * A1 – Comparar
 * Página de comparação de até 3 veículos lado a lado.
 */
import { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import { formatCurrency, formatKm } from '../utils/formatters';
import FotoPlaceholder from '../components/Gallery/FotoPlaceholder';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
}

const MAX = 3;

function Celula({ value, winner }: { value: string; winner?: boolean }) {
  return (
    <td className="px-4 py-3 text-sm text-center">
      {winner ? (
        <span className="comparar-winner">{value}</span>
      ) : (
        <span className="font-data" style={{ color: 'var(--text-primary)' }}>{value}</span>
      )}
    </td>
  );
}

export default function Comparar({ veiculos }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [filtro, setFiltro] = useState('');

  const disponiveis = useMemo(() =>
    veiculos.filter(v =>
      !selecionados.includes(v.id) &&
      (v.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
       v.marca.toLowerCase().includes(filtro.toLowerCase()))
    ),
    [veiculos, selecionados, filtro]
  );

  const vSel = useMemo(
    () => selecionados.map(id => veiculos.find(v => v.id === id)!).filter(Boolean),
    [selecionados, veiculos]
  );

  const remover = (id: string) => setSelecionados(prev => prev.filter(x => x !== id));
  const adicionar = (id: string) => {
    if (selecionados.length >= MAX) return;
    setSelecionados(prev => [...prev, id]);
    setFiltro('');
  };

  // Helpers para highlight de vencedores
  const maxMercado = Math.max(...vSel.map(v => v.valorMercado));
  const maxFipe = Math.max(...vSel.map(v => v.valorFipe));
  const minKm = Math.min(...vSel.map(v => v.quilometragem));
  const maxAno = Math.max(...vSel.map(v => v.ano));

  const rows: { label: string; fn: (v: Veiculo) => string; winnerFn?: (v: Veiculo) => boolean }[] = [
    { label: 'Marca', fn: v => v.marca },
    { label: 'Tipo', fn: v => v.carroceria },
    { label: 'Ano', fn: v => String(v.ano), winnerFn: v => v.ano === maxAno },
    { label: 'Quilometragem', fn: v => formatKm(v.quilometragem), winnerFn: v => v.quilometragem === minKm },
    { label: 'Cor', fn: v => v.cor },
    { label: 'Combustível', fn: v => v.combustivel },
    { label: 'Câmbio', fn: v => v.cambio },
    { label: 'Valor Mercado', fn: v => formatCurrency(v.valorMercado), winnerFn: v => v.valorMercado === maxMercado },
    { label: 'Valor FIPE', fn: v => formatCurrency(v.valorFipe), winnerFn: v => v.valorFipe === maxFipe },
    { label: 'Motor', fn: v => v.fichatecnica.motor },
    { label: 'Potência', fn: v => v.fichatecnica.potencia },
    { label: 'Aceleração', fn: v => v.fichatecnica.aceleracao },
    { label: 'Vel. Máxima', fn: v => v.fichatecnica.velocidadeMaxima },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 page-transition">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Comparador de Veículos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Compare até {MAX} veículos lado a lado
        </p>
      </div>

      {/* Seletor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: MAX }).map((_, idx) => {
          const v = vSel[idx];
          return (
            <div key={idx}>
              {v ? (
                <div
                  className="relative rounded-xl overflow-hidden border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                >
                  {v.fotos.length > 0 ? (
                    <img src={v.fotos[0]} alt={v.modelo} className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
                  ) : (
                    <div style={{ aspectRatio: '16/9' }}>
                      <FotoPlaceholder className="photo-placeholder w-full h-full" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="sa-label text-[10px] uppercase">{v.marca}</p>
                    <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{v.modelo}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.ano}</p>
                  </div>
                  <button
                    onClick={() => remover(v.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  {selecionados.length < MAX && idx === selecionados.length ? (
                    <div>
                      <input
                        type="text"
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                        placeholder="Buscar veículo..."
                        className="sa-input w-full mb-2 text-sm"
                      />
                      <div
                        className="rounded-xl border overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', maxHeight: 220, overflowY: 'auto' }}
                      >
                        {disponiveis.length === 0 ? (
                          <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum veículo disponível</p>
                        ) : (
                          disponiveis.map(v => (
                            <button
                              key={v.id}
                              onClick={() => adicionar(v.id)}
                              className="w-full text-left px-4 py-3 border-b flex items-center gap-3"
                              style={{ borderColor: 'var(--border-subtle)' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <Plus className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.modelo}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.marca} · {v.ano}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl border-2 border-dashed flex items-center justify-center"
                      style={{ borderColor: 'var(--border-primary)', aspectRatio: '4/3', opacity: 0.4 }}
                    >
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Slot livre</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabela comparativa */}
      {vSel.length >= 2 && (
        <div
          className="rounded-xl border overflow-hidden animate-fade-in-up"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <div className="sa-table-wrapper overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                    Atributo
                  </th>
                  {vSel.map(v => (
                    <th key={v.id} className="px-4 py-3 text-center text-xs uppercase tracking-widest" style={{ color: 'var(--accent-primary)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                      {v.modelo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>
                      {row.label}
                    </td>
                    {vSel.map(v => {
                      const val = row.fn(v);
                      const winner = !!(val && val !== '—' && val !== '0 km' && row.winnerFn?.(v));
                      return <Celula key={v.id} value={val || '—'} winner={winner} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vSel.length < 2 && (
        <div className="empty-state">
          <p className="text-lg font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Selecione ao menos 2 veículos
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Escolha os veículos acima para comparar lado a lado.
          </p>
        </div>
      )}
    </div>
  );
}
