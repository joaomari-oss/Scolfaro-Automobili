/**
 * B1 – Agenda
 * Página de agenda de manutenção da coleção.
 */
import { useState, useMemo } from 'react';
import { Calendar, Plus, CheckCircle, Clock, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import type { Veiculo, Agendamento, StatusAgendamento } from '../types/veiculo';
import { formatCurrency } from '../utils/formatters';
import { generateId } from '../utils/formatters';
import { showToast } from '../components/Layout/Toast';

interface Props {
  veiculos: Veiculo[];
  agendamentos: Agendamento[];
  onSalvarAgendamento: (ag: Agendamento) => void;
  onRemoverAgendamento: (id: string) => void;
}

function statusInfo(ag: Agendamento, hoje: string): { class: string; icon: React.ReactNode; label: string } {
  if (ag.status === 'concluido') return { class: 'agenda-concluido', icon: <CheckCircle className="w-4 h-4" />, label: 'Concluído' };
  if (ag.dataAgendada < hoje) return { class: 'agenda-atrasado', icon: <AlertCircle className="w-4 h-4" />, label: 'Atrasado' };
  return { class: 'agenda-pendente', icon: <Clock className="w-4 h-4" />, label: 'Pendente' };
}

export default function Agenda({ veiculos, agendamentos, onSalvarAgendamento, onRemoverAgendamento }: Props) {
  const hoje = new Date().toISOString().split('T')[0];
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusAgendamento>('todos');
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState<Agendamento | null>(null);

  // Form state
  const [formVeiculoId, setFormVeiculoId] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formData, setFormData] = useState(hoje);
  const [formCusto, setFormCusto] = useState<number | ''>('');
  const [formObs, setFormObs] = useState('');

  const resetForm = () => {
    setFormVeiculoId('');
    setFormTipo('');
    setFormDescricao('');
    setFormData(hoje);
    setFormCusto('');
    setFormObs('');
  };

  const abrirEdicao = (ag: Agendamento) => {
    setEditando(ag);
    setFormVeiculoId(ag.veiculoId);
    setFormTipo(ag.tipo);
    setFormDescricao(ag.descricao);
    setFormData(ag.dataAgendada);
    setFormCusto(ag.custo ?? '');
    setFormObs(ag.observacoes ?? '');
    setAdicionando(true);
  };

  const handleSalvar = () => {
    if (!formVeiculoId || !formDescricao.trim() || !formData) {
      showToast('error', 'Preencha veículo, descrição e data.');
      return;
    }
    const status: StatusAgendamento = formData < hoje ? 'atrasado' : 'pendente';
    const ag: Agendamento = {
      id: editando?.id ?? generateId(),
      veiculoId: formVeiculoId,
      tipo: formTipo,
      descricao: formDescricao.trim(),
      dataAgendada: formData,
      status: editando?.status === 'concluido' ? 'concluido' : status,
      custo: formCusto ? Number(formCusto) : undefined,
      observacoes: formObs.trim() || undefined,
      createdAt: editando?.createdAt ?? new Date().toISOString(),
    };
    onSalvarAgendamento(ag);
    showToast('success', editando ? 'Agendamento atualizado!' : 'Agendamento criado!');
    resetForm();
    setAdicionando(false);
    setEditando(null);
  };

  const marcarConcluido = (ag: Agendamento) => {
    onSalvarAgendamento({
      ...ag,
      status: ag.status === 'concluido' ? (ag.dataAgendada < hoje ? 'atrasado' : 'pendente') : 'concluido',
      dataConcluido: ag.status !== 'concluido' ? hoje : undefined,
    });
  };

  const lista = useMemo(() => {
    return agendamentos
      .filter(ag => {
        const statusAtual = ag.status === 'concluido' ? 'concluido' : ag.dataAgendada < hoje ? 'atrasado' : 'pendente';
        if (filtroStatus !== 'todos' && filtroStatus !== statusAtual) return false;
        if (filtroVeiculo && ag.veiculoId !== filtroVeiculo) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'concluido' && b.status !== 'concluido') return 1;
        if (a.status !== 'concluido' && b.status === 'concluido') return -1;
        return a.dataAgendada.localeCompare(b.dataAgendada);
      });
  }, [agendamentos, filtroStatus, filtroVeiculo, hoje]);

  const pendentes = agendamentos.filter(ag => ag.status !== 'concluido' && ag.dataAgendada >= hoje).length;
  const atrasados = agendamentos.filter(ag => ag.status !== 'concluido' && ag.dataAgendada < hoje).length;

  const tiposComuns = ['Revisão', 'Troca de óleo', 'Alinhamento', 'Balanceamento', 'Freios', 'Pneus', 'IPVA', 'Licenciamento', 'Seguro', 'Outro'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 page-transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Agenda de Manutenção
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pendentes} pendentes · {atrasados} atrasados
          </p>
        </div>
        <button className="sa-btn-primary" onClick={() => { setAdicionando(v => !v); setEditando(null); resetForm(); }}>
          <Plus className="w-4 h-4" /> Novo agendamento
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pendentes', valor: agendamentos.filter(ag => ag.status !== 'concluido' && ag.dataAgendada >= hoje).length, cor: 'var(--color-warning)' },
          { label: 'Atrasados', valor: atrasados, cor: 'var(--color-danger)' },
          { label: 'Concluídos', valor: agendamentos.filter(ag => ag.status === 'concluido').length, cor: 'var(--color-success)' },
        ].map(item => (
          <div key={item.label} className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: item.cor }} />
              <span className="sa-label text-[10px] uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="font-data font-bold text-3xl" style={{ color: item.cor }}>{item.valor}</p>
          </div>
        ))}
      </div>

      {/* Formulário */}
      {adicionando && (
        <div
          className="p-6 rounded-xl border space-y-4 animate-fade-in-up"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editando ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="sa-label text-xs block mb-1">Veículo *</label>
              <select value={formVeiculoId} onChange={e => setFormVeiculoId(e.target.value)} className="sa-select w-full">
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.ano})</option>)}
              </select>
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Tipo</label>
              <select value={formTipo} onChange={e => setFormTipo(e.target.value)} className="sa-select w-full">
                <option value="">Selecione...</option>
                {tiposComuns.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Descrição *</label>
              <input type="text" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} className="sa-input w-full" placeholder="Ex: Revisão dos 10.000 km" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Data *</label>
              <input type="date" value={formData} onChange={e => setFormData(e.target.value)} className="sa-input w-full" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Custo estimado (R$)</label>
              <input type="number" value={formCusto} onChange={e => setFormCusto(e.target.value ? Number(e.target.value) : '')} className="sa-input w-full font-data" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Observações</label>
              <input type="text" value={formObs} onChange={e => setFormObs(e.target.value)} className="sa-input w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="sa-btn-primary" onClick={handleSalvar}>Salvar</button>
            <button className="sa-btn-ghost" onClick={() => { setAdicionando(false); setEditando(null); resetForm(); }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        {(['todos', 'pendente', 'atrasado', 'concluido'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={filtroStatus === s
              ? { backgroundColor: 'var(--accent-primary)', color: '#0A0A0A', borderColor: 'var(--accent-primary)' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }
            }
          >
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select value={filtroVeiculo} onChange={e => setFiltroVeiculo(e.target.value)} className="sa-select text-xs py-1.5 ml-auto">
          <option value="">Todos os veículos</option>
          {veiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
        </select>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="empty-state">
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Nenhum agendamento</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Crie um agendamento para manter sua frota em dia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(ag => {
            const veiculo = veiculos.find(v => v.id === ag.veiculoId);
            return (
              <div
                key={ag.id}
                className="p-4 rounded-xl border flex items-start justify-between gap-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)',
                  opacity: ag.status === 'concluido' ? 0.7 : 1,
                }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => marcarConcluido(ag)}
                    className={`mt-0.5 p-1 rounded-full border ${statusInfo(ag, hoje).class}`}
                    style={{ borderWidth: 1 }}
                    title={ag.status === 'concluido' ? 'Marcar como pendente' : 'Marcar como concluído'}
                  >
                    {statusInfo(ag, hoje).icon}
                  </button>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${ag.status === 'concluido' ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>
                      {ag.descricao}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo removido'} · {ag.tipo && `${ag.tipo} · `}
                      {new Date(ag.dataAgendada + 'T00:00').toLocaleDateString('pt-BR')}
                    </p>
                    {ag.custo && (
                      <p className="text-xs mt-0.5 font-data" style={{ color: 'var(--accent-primary)' }}>
                        Custo estimado: {formatCurrency(ag.custo)}
                      </p>
                    )}
                    {ag.observacoes && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ag.observacoes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => abrirEdicao(ag)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onRemoverAgendamento(ag.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
