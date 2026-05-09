/**
 * E1 – PerfilPublico
 * Página pública da coleção sem dados financeiros sensíveis.
 */
import { useState } from 'react';
import type { Veiculo } from '../types/veiculo';
import { formatKm } from '../utils/formatters';
import FotoPlaceholder from '../components/Gallery/FotoPlaceholder';
import TagsVeiculo from '../components/Cards/TagsVeiculo';

interface Props {
  veiculos: Veiculo[];
}

function VeiculoCardPublico({ veiculo }: { veiculo: Veiculo }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="relative" style={{ aspectRatio: '16/10' }}>
        {veiculo.fotos.length > 0 ? (
          <img src={veiculo.fotos[0]} alt={veiculo.modelo} className="w-full h-full object-cover" />
        ) : (
          <FotoPlaceholder className="photo-placeholder w-full h-full" />
        )}
        <div className="absolute top-3 left-3">
          <span className="sa-badge text-xs">{veiculo.carroceria}</span>
        </div>
        {veiculo.favorito && (
          <div className="absolute top-3 right-3">
            <span className="text-lg">⭐</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="sa-label text-[11px] uppercase tracking-widest mb-1">{veiculo.marca}</p>
        <h3 className="font-display font-bold text-base leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          {veiculo.modelo}
        </h3>
        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>{veiculo.ano}</span>
          <span>·</span>
          <span>{formatKm(veiculo.quilometragem)}</span>
          <span>·</span>
          <span>{veiculo.cor}</span>
        </div>
        <div className="flex gap-2 flex-wrap text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="sa-chip">{veiculo.combustivel}</span>
          <span className="sa-chip">{veiculo.cambio}</span>
          {veiculo.fichatecnica.potencia && (
            <span className="sa-chip">{veiculo.fichatecnica.potencia}</span>
          )}
        </div>
        {(veiculo.tags ?? []).length > 0 && (
          <div className="mt-2">
            <TagsVeiculo tags={veiculo.tags ?? []} onChange={() => {}} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerfilPublico({ veiculos }: Props) {
  const [filtroTipo, setFiltroTipo] = useState('');

  const tipos = [...new Set(veiculos.map(v => v.carroceria))];
  const filtrados = filtroTipo ? veiculos.filter(v => v.carroceria === filtroTipo) : veiculos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 page-transition">
      {/* Hero */}
      <div className="text-center mb-12">
        <p className="font-display font-extrabold tracking-widest text-4xl mb-2" style={{ color: 'var(--accent-primary)' }}>
          SCOLFARO
        </p>
        <p className="font-display tracking-[0.4em] text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          AUTOMOBILI
        </p>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Coleção de {veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''} exclusivos
        </p>
      </div>

      {/* Filtro de tipos */}
      {tipos.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          <button
            onClick={() => setFiltroTipo('')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={!filtroTipo
              ? { backgroundColor: 'var(--accent-primary)', color: '#0A0A0A', borderColor: 'var(--accent-primary)' }
              : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }
            }
          >
            Todos ({veiculos.length})
          </button>
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={filtroTipo === t
                ? { backgroundColor: 'var(--accent-primary)', color: '#0A0A0A', borderColor: 'var(--accent-primary)' }
                : { backgroundColor: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }
              }
            >
              {t} ({veiculos.filter(v => v.carroceria === t).length})
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map(v => <VeiculoCardPublico key={v.id} veiculo={v} />)}
        </div>
      ) : (
        <div className="empty-state">
          <p style={{ color: 'var(--text-muted)' }}>Nenhum veículo nesta categoria.</p>
        </div>
      )}

      <div className="text-center mt-16">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Powered by Scolfaro Automobili Dashboard
        </p>
      </div>
    </div>
  );
}
