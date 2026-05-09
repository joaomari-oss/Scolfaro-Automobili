/**
 * B4 – SeguroCard
 * Controle de seguro do veículo.
 */
import { useState } from 'react';
import { Shield, Plus } from 'lucide-react';
import type { Seguro } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';
import { generateId } from '../../utils/formatters';

interface Props {
  seguro?: Seguro;
  onChange: (seguro: Seguro | undefined) => void;
}

function diasParaVencer(vigenciaFim: string): number {
  const hoje = new Date();
  const fim = new Date(vigenciaFim);
  return Math.floor((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SeguroCard({ seguro, onChange }: Props) {
  const [editando, setEditando] = useState(!seguro);
  const [seguradora, setSeguradora] = useState(seguro?.seguradora ?? '');
  const [numeroApolice, setNumeroApolice] = useState(seguro?.numeroApolice ?? '');
  const [valorCobertura, setValorCobertura] = useState<number | ''>(seguro?.valorCobertura ?? '');
  const [premio, setPremio] = useState<number | ''>(seguro?.premio ?? '');
  const [vigenciaInicio, setVigenciaInicio] = useState(seguro?.vigenciaInicio ?? '');
  const [vigenciaFim, setVigenciaFim] = useState(seguro?.vigenciaFim ?? '');
  const [observacoes, setObservacoes] = useState(seguro?.observacoes ?? '');

  const handleSalvar = () => {
    if (!seguradora.trim() || !vigenciaFim) return;
    const novoSeguro: Seguro = {
      id: seguro?.id ?? generateId(),
      seguradora: seguradora.trim(),
      numeroApolice: numeroApolice.trim(),
      valorCobertura: Number(valorCobertura) || 0,
      premio: Number(premio) || 0,
      vigenciaInicio,
      vigenciaFim,
      observacoes: observacoes.trim() || undefined,
    };
    onChange(novoSeguro);
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {seguro ? 'Edite os dados do seguro.' : 'Cadastre o seguro deste veículo.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="sa-label text-xs block mb-1">Seguradora *</label>
            <input type="text" value={seguradora} onChange={e => setSeguradora(e.target.value)} className="sa-input w-full" placeholder="Ex: Porto Seguro" />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Nº Apólice</label>
            <input type="text" value={numeroApolice} onChange={e => setNumeroApolice(e.target.value)} className="sa-input w-full font-data" />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Cobertura (R$)</label>
            <input type="number" value={valorCobertura} onChange={e => setValorCobertura(e.target.value ? Number(e.target.value) : '')} className="sa-input w-full font-data" />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Prêmio Anual (R$)</label>
            <input type="number" value={premio} onChange={e => setPremio(e.target.value ? Number(e.target.value) : '')} className="sa-input w-full font-data" />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Início da Vigência</label>
            <input type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} className="sa-input w-full" />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Fim da Vigência *</label>
            <input type="date" value={vigenciaFim} onChange={e => setVigenciaFim(e.target.value)} className="sa-input w-full" />
          </div>
          <div className="sm:col-span-2">
            <label className="sa-label text-xs block mb-1">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="sa-input w-full resize-none" rows={2} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="sa-btn-primary" onClick={handleSalvar} disabled={!seguradora.trim() || !vigenciaFim}>Salvar</button>
          {seguro && <button className="sa-btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>}
          {seguro && (
            <button className="sa-btn-ghost ml-auto" style={{ color: 'var(--color-danger)' }} onClick={() => { onChange(undefined); setEditando(true); }}>
              Remover
            </button>
          )}
        </div>
      </div>
    );
  }

  // View mode
  if (!seguro) return null;
  const dias = diasParaVencer(seguro.vigenciaFim);
  const statusClass = dias < 0 ? 'seguro-vencido' : dias <= 30 ? 'seguro-aviso' : 'seguro-vigente';
  const statusLabel = dias < 0 ? `Vencido há ${Math.abs(dias)} dias` : dias === 0 ? 'Vence hoje!' : `Vence em ${dias} dias`;

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {seguro.seguradora}
            </span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusClass}`}
            style={{ backgroundColor: dias < 0 ? 'rgba(239,68,68,0.1)' : dias <= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)' }}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Apólice', valor: seguro.numeroApolice || '—' },
            { label: 'Cobertura', valor: formatCurrency(seguro.valorCobertura) },
            { label: 'Prêmio Anual', valor: formatCurrency(seguro.premio) },
            { label: 'Vigência', valor: seguro.vigenciaFim ? new Date(seguro.vigenciaFim + 'T00:00').toLocaleDateString('pt-BR') : '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="font-data text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.valor}</p>
            </div>
          ))}
        </div>

        {seguro.observacoes && (
          <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
            {seguro.observacoes}
          </p>
        )}
      </div>

      <button className="sa-btn-ghost text-sm" onClick={() => setEditando(true)}>
        <Plus className="w-4 h-4" /> Editar seguro
      </button>
    </div>
  );
}
