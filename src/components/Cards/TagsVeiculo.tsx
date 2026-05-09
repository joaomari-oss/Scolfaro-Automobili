/**
 * C4 – TagsVeiculo
 * Gerencia tags personalizadas por veículo.
 */
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Tag } from '../../types/veiculo';
import { generateId } from '../../utils/formatters';

const CORES_PRESET = [
  '#F5C400', '#3B82F6', '#10B981', '#EF4444',
  '#8B5CF6', '#F97316', '#EC4899', '#14B8A6',
];

interface Props {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  readOnly?: boolean;
}

export default function TagsVeiculo({ tags, onChange, readOnly }: Props) {
  const [adicionando, setAdicionando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaCor, setNovaCor] = useState(CORES_PRESET[0]);

  const handleAdicionar = () => {
    if (!novoNome.trim()) return;
    const nova: Tag = { id: generateId(), nome: novoNome.trim(), cor: novaCor };
    onChange([...tags, nova]);
    setNovoNome('');
    setNovaCor(CORES_PRESET[0]);
    setAdicionando(false);
  };

  const handleRemover = (id: string) => {
    onChange(tags.filter(t => t.id !== id));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="tag-chip"
            style={{ color: tag.cor, borderColor: tag.cor + '50', backgroundColor: tag.cor + '18' }}
          >
            {tag.nome}
            {!readOnly && (
              <button onClick={() => handleRemover(tag.id)} className="ml-1 opacity-70 hover:opacity-100">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <button
            onClick={() => setAdicionando(v => !v)}
            className="tag-chip"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Plus className="w-3 h-3" /> Tag
          </button>
        )}
      </div>

      {adicionando && !readOnly && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <input
            autoFocus
            type="text"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
            className="sa-input text-sm py-1.5"
            placeholder="Nome da tag"
            style={{ width: 140 }}
          />
          <div className="flex gap-1">
            {CORES_PRESET.map(c => (
              <button
                key={c}
                onClick={() => setNovaCor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: novaCor === c ? 'var(--text-primary)' : 'transparent',
                  transform: novaCor === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <button className="sa-btn-primary py-1.5 text-sm" onClick={handleAdicionar} disabled={!novoNome.trim()}>
            Adicionar
          </button>
          <button className="sa-btn-ghost py-1.5 text-sm" onClick={() => setAdicionando(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
