/**
 * B3 – ProprietariosTimeline
 * Histórico de proprietários do veículo.
 */
import { useState } from 'react';
import { User, Plus, Trash2 } from 'lucide-react';
import type { Proprietario } from '../../types/veiculo';
import { generateId } from '../../utils/formatters';

interface Props {
  proprietarios: Proprietario[];
  onChange: (lista: Proprietario[]) => void;
}

export default function ProprietariosTimeline({ proprietarios, onChange }: Props) {
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleAdicionar = () => {
    if (!nome.trim() || !dataInicio) return;
    const novo: Proprietario = {
      id: generateId(),
      nome: nome.trim(),
      dataInicio,
      dataFim: dataFim || undefined,
      observacoes: observacoes.trim() || undefined,
    };
    onChange([...proprietarios, novo]);
    setNome(''); setDataInicio(''); setDataFim(''); setObservacoes('');
    setAdicionando(false);
  };

  const handleRemover = (id: string) => {
    onChange(proprietarios.filter(p => p.id !== id));
  };

  const formatData = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const lista = [...proprietarios].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  return (
    <div className="space-y-4">
      {lista.length === 0 && !adicionando && (
        <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
          Nenhum proprietário registrado.
        </p>
      )}

      {lista.length > 0 && (
        <div className="relative pl-8 space-y-4">
          <div className="timeline-line" />
          {lista.map((p, i) => (
            <div key={p.id} className="relative">
              <div
                className="absolute -left-8 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'var(--bg-primary)', zIndex: 1 }}
              >
                <User className="w-2.5 h-2.5 text-black" />
              </div>
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {i + 1}º Dono · {p.nome}
                    </p>
                    <p className="text-xs mt-0.5 font-data" style={{ color: 'var(--text-muted)' }}>
                      {formatData(p.dataInicio)}{p.dataFim ? ` → ${formatData(p.dataFim)}` : ' → atual'}
                    </p>
                    {p.observacoes && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{p.observacoes}</p>
                    )}
                  </div>
                  <button onClick={() => handleRemover(p.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-danger)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adicionando ? (
        <div
          className="p-4 rounded-xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
        >
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Novo Proprietário</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="sa-label text-xs block mb-1">Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="sa-input w-full" placeholder="Nome do proprietário" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Data de Início *</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="sa-input w-full" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Data de Fim</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="sa-input w-full" />
            </div>
            <div>
              <label className="sa-label text-xs block mb-1">Observações</label>
              <input type="text" value={observacoes} onChange={e => setObservacoes(e.target.value)} className="sa-input w-full" placeholder="Opcional" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="sa-btn-primary" onClick={handleAdicionar} disabled={!nome.trim() || !dataInicio}>Salvar</button>
            <button className="sa-btn-ghost" onClick={() => setAdicionando(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button className="sa-btn-ghost" onClick={() => setAdicionando(true)}>
          <Plus className="w-4 h-4" /> Adicionar proprietário
        </button>
      )}
    </div>
  );
}
