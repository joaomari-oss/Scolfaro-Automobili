import { useState } from 'react';
import type { Veiculo, Gasto, TipoGasto } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculo: Veiculo;
  onAdicionarGasto: (gasto: Omit<Gasto, 'id' | 'createdAt'>) => void;
  onEditarGasto: (gastoId: string, dados: Omit<Gasto, 'id' | 'createdAt'>) => void;
  onRemoverGasto: (gastoId: string) => void;
}

type Filtro = 'todos' | TipoGasto;

const today = new Date().toISOString().split('T')[0];

export default function ControleGastos({ veiculo, onAdicionarGasto, onEditarGasto, onRemoverGasto }: Props) {
  const gastos = veiculo.gastos ?? [];

  // --- Filtro
  const [filtro, setFiltro] = useState<Filtro>('todos');

  // --- Novo gasto
  const [novoTipo, setNovoTipo] = useState<TipoGasto>('investimento');
  const [novoData, setNovoData] = useState(today);
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoValor, setNovoValor] = useState<number | ''>('');

  // --- Edição inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTipo, setEditTipo] = useState<TipoGasto>('investimento');
  const [editData, setEditData] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editValor, setEditValor] = useState<number | ''>('');

  // --- Confirmação de remoção
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  // Totais
  const totalInvestimentos = gastos.filter(g => g.tipo === 'investimento').reduce((s, g) => s + g.valor, 0);
  const totalManutencoes   = gastos.filter(g => g.tipo === 'manutencao').reduce((s, g) => s + g.valor, 0);
  const totalGeral         = totalInvestimentos + totalManutencoes;

  // Lista filtrada e ordenada
  const listaFiltrada = gastos
    .filter(g => filtro === 'todos' || g.tipo === filtro)
    .sort((a, b) => b.data.localeCompare(a.data));

  const countInv = gastos.filter(g => g.tipo === 'investimento').length;
  const countMan = gastos.filter(g => g.tipo === 'manutencao').length;

  const formatDataBR = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleAdicionar = () => {
    if (!novoDescricao.trim()) return;
    if (!novoValor || Number(novoValor) <= 0) return;
    onAdicionarGasto({
      tipo: novoTipo,
      descricao: novoDescricao.trim(),
      valor: Number(novoValor),
      data: novoData,
    });
    setNovoDescricao('');
    setNovoValor('');
    setNovoData(today);
    setNovoTipo('investimento');
  };

  const iniciarEdicao = (g: Gasto) => {
    setEditandoId(g.id);
    setEditTipo(g.tipo);
    setEditData(g.data);
    setEditDescricao(g.descricao);
    setEditValor(g.valor);
  };

  const handleSalvarEdicao = (id: string) => {
    if (!editDescricao.trim() || !editValor || Number(editValor) <= 0) return;
    onEditarGasto(id, {
      tipo: editTipo,
      descricao: editDescricao.trim(),
      valor: Number(editValor),
      data: editData,
    });
    setEditandoId(null);
  };

  const handleRemover = (id: string) => {
    onRemoverGasto(id);
    setRemovendoId(null);
  };

  const badgeStyle = (tipo: TipoGasto) =>
    tipo === 'investimento'
      ? { backgroundColor: 'rgba(202,158,76,0.15)', color: '#c9a84c', border: '1px solid rgba(202,158,76,0.4)' }
      : { backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)' };

  return (
    <div className="space-y-6">

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: '💰 Total Investido', valor: totalInvestimentos },
          { label: '🔧 Total em Manutenções', valor: totalManutencoes },
          { label: '📊 Total Geral', valor: totalGeral },
        ].map(item => (
          <div
            key={item.label}
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            <p className="font-data font-semibold text-lg" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(item.valor)}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'todos',        label: `Todos (${gastos.length})` },
          { key: 'investimento', label: `Investimentos (${countInv})` },
          { key: 'manutencao',   label: `Manutenções (${countMan})` },
        ] as { key: Filtro; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
            style={
              filtro === f.key
                ? { backgroundColor: 'var(--accent-primary)', color: '#000' }
                : { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de gastos */}
      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {filtro === 'todos'
              ? 'Nenhum gasto registrado ainda. Adicione o primeiro abaixo.'
              : 'Nenhum gasto do tipo selecionado.'}
          </p>
        ) : (
          listaFiltrada.map(gasto => (
            <div
              key={gasto.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
            >
              {editandoId === gasto.id ? (
                /* Modo edição inline */
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={editTipo}
                      onChange={e => setEditTipo(e.target.value as TipoGasto)}
                      className="sa-select flex-1"
                    >
                      <option value="investimento">💛 Investimento</option>
                      <option value="manutencao">🔧 Manutenção</option>
                    </select>
                    <input
                      type="date"
                      value={editData}
                      onChange={e => setEditData(e.target.value)}
                      className="sa-input"
                      style={{ width: 'auto' }}
                    />
                  </div>
                  <textarea
                    value={editDescricao}
                    onChange={e => setEditDescricao(e.target.value)}
                    rows={2}
                    className="sa-input resize-none w-full"
                    style={{ height: 'auto' }}
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={editValor}
                      onChange={e => setEditValor(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Valor (R$)"
                      className="sa-input font-data flex-1"
                    />
                    <button
                      onClick={() => handleSalvarEdicao(gasto.id)}
                      className="sa-btn-primary whitespace-nowrap text-sm px-4"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="sa-btn-ghost text-sm px-3"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : removendoId === gasto.id ? (
                /* Confirmação de remoção */
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Remover gasto de <span className="font-data font-semibold" style={{ color: 'var(--color-danger)' }}>{formatCurrency(gasto.valor)}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemover(gasto.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setRemovendoId(null)}
                      className="sa-btn-ghost text-xs px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo visualização */
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded uppercase tracking-wide"
                      style={badgeStyle(gasto.tipo)}
                    >
                      {gasto.tipo === 'investimento' ? 'Investimento' : 'Manutenção'}
                    </span>
                    <span className="text-xs font-data" style={{ color: 'var(--text-muted)' }}>
                      {formatDataBR(gasto.data)}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{gasto.descricao}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-data font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(gasto.valor)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => iniciarEdicao(gasto)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setRemovendoId(gasto.id)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulário de novo gasto */}
      <div
        className="pt-6 mt-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          + Registrar Novo Gasto
        </h4>

        <div className="flex gap-3 mb-3">
          <select
            value={novoTipo}
            onChange={e => setNovoTipo(e.target.value as TipoGasto)}
            className="sa-select flex-1"
          >
            <option value="investimento">💛 Investimento</option>
            <option value="manutencao">🔧 Manutenção</option>
          </select>
          <input
            type="date"
            value={novoData}
            onChange={e => setNovoData(e.target.value)}
            className="sa-input"
            style={{ width: '150px', flexShrink: 0 }}
          />
        </div>

        <textarea
          value={novoDescricao}
          onChange={e => setNovoDescricao(e.target.value)}
          placeholder="Descreva o que foi feito ou modificado..."
          rows={2}
          className="sa-input resize-none w-full mb-3"
          style={{ height: 'auto' }}
        />

        <div className="flex gap-3">
          <input
            type="number"
            value={novoValor}
            onChange={e => setNovoValor(e.target.value ? Number(e.target.value) : '')}
            placeholder="Valor (R$)"
            className="sa-input font-data flex-1"
          />
          <button
            onClick={handleAdicionar}
            className="sa-btn-primary whitespace-nowrap"
          >
            ✅ Adicionar Gasto
          </button>
        </div>
      </div>
    </div>
  );
}
