import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, Car, Plus } from 'lucide-react';
import type { Veiculo, TipoVeiculo } from '../types/veiculo';
import { formatCurrency } from '../utils/formatters';
import CategoriaCard, { categoriaLabels } from '../components/Cards/CategoriaCard';
import VeiculoCard from '../components/Cards/VeiculoCard';
import AlertasValor from '../components/Layout/AlertasValor';
import TimelineColecao from '../components/Charts/TimelineColecao';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  onSelectVeiculo: (v: Veiculo) => void;
}

export default function Inicio({ veiculos, theme, onSelectVeiculo }: Props) {
  const navigate = useNavigate();
  const [selectedTipo, setSelectedTipo] = useState<TipoVeiculo | null>(null);

  const totalValor   = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const totalFipe    = veiculos.reduce((s, v) => s + v.valorFipe, 0);
  const favoritos    = veiculos.filter(v => v.favorito);

  // Categories with counts (only show those with vehicles)
  const categorias = (Object.entries(categoriaLabels) as [TipoVeiculo, string][])
    .map(([tipo, label]) => ({
      tipo,
      label,
      count: veiculos.filter(v => v.tipo === tipo).length,
    }))
    .filter(c => c.count > 0);

  const veiculosFiltrados = selectedTipo
    ? veiculos.filter(v => v.tipo === selectedTipo)
    : [];

  const handleToggleFavorito = () => {}; // handled at App level via modal
  const handleRemove = () => {};

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6">

      {/* ── ALERTAS FIPE ─────────────────────────────────────── */}
      {veiculos.length > 0 && (
        <div className="pt-6">
          <AlertasValor veiculos={veiculos} onSelectVeiculo={onSelectVeiculo} />
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        {/* Dot pattern background */}
        <div className="absolute inset-0 hero-dot-pattern opacity-50 pointer-events-none" />
        {/* Radial accent glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 120%, var(--accent-primary-muted) 0%, transparent 70%)',
          }}
        />

        <div className="relative text-center space-y-6 animate-fade-in-up">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2">
            <span className="sa-badge uppercase tracking-widest text-[10px]">Acervo Privado</span>
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Scolfaro<br />
            <span style={{ color: 'var(--accent-primary)' }}>Automobili</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {veiculos.length} {veiculos.length === 1 ? 'veículo' : 'veículos'} no acervo familiar
          </p>

          {/* Total value badge */}
          {veiculos.length > 0 && (
            <div
              className="inline-flex flex-col items-center gap-1 px-6 py-4 rounded-2xl border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <span className="sa-label text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Valor Total do Acervo
              </span>
              <span className="font-data font-medium text-3xl" style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(totalValor)}
              </span>
              <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>
                FIPE: {formatCurrency(totalFipe)}
              </span>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/acervo')}
              className="sa-btn-primary px-6 py-2.5"
            >
              <Car className="w-4 h-4" />
              Ver Acervo
            </button>
            <button
              onClick={() => navigate('/adicionar')}
              className="sa-btn-ghost px-6 py-2.5"
            >
              <Plus className="w-4 h-4" />
              Adicionar Veículo
            </button>
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS ───────────────────────────────────────── */}
      {categorias.length > 0 && (
        <section className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Explorar por Tipo
            </h2>
            {selectedTipo && (
              <button
                onClick={() => setSelectedTipo(null)}
                className="text-sm font-medium"
                style={{ color: 'var(--accent-primary)' }}
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {categorias.map((cat, i) => (
              <div
                key={cat.tipo}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}
              >
                <CategoriaCard
                  tipo={cat.tipo}
                  label={cat.label}
                  count={cat.count}
                  theme={theme}
                  selected={selectedTipo === cat.tipo}
                  onClick={() => {
                    if (selectedTipo === cat.tipo) {
                      setSelectedTipo(null);
                    } else {
                      setSelectedTipo(cat.tipo);
                      navigate(`/acervo?tipo=${cat.tipo}`);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAVORITOS ────────────────────────────────────────── */}
      <section className="pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Star className="w-5 h-5" fill="var(--accent-primary)" style={{ color: 'var(--accent-primary)' }} />
            Favoritos
            <span className="font-data text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({favoritos.length})
            </span>
          </h2>
          {favoritos.length > 0 && (
            <button
              onClick={() => navigate('/favoritos')}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--accent-primary)' }}
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {favoritos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favoritos.map((v, i) => (
              <div key={v.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}>
                <VeiculoCard
                  veiculo={v}
                  theme={theme}
                  onOpen={onSelectVeiculo}
                  onToggleFavorito={() => {}}
                  onRemove={() => {}}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Star className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-display font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhum favorito ainda
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Marque veículos com ⭐ no Acervo para vê-los aqui
            </p>
            <button onClick={() => navigate('/acervo')} className="sa-btn-ghost text-sm">
              Ir para o Acervo
            </button>
          </div>
        )}
      </section>

      {/* ── TODOS OS VEÍCULOS (filtrado por categoria) ────────── */}
      {selectedTipo && veiculosFiltrados.length > 0 && (
        <section className="pb-16">
          <h2 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
            {categoriaLabels[selectedTipo]}
            <span className="font-data text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
              {veiculosFiltrados.length} veículo{veiculosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {veiculosFiltrados.map((v, i) => (
              <div key={v.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}>
                <VeiculoCard
                  veiculo={v}
                  theme={theme}
                  onOpen={onSelectVeiculo}
                  onToggleFavorito={handleToggleFavorito}
                  onRemove={handleRemove}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>

      {/* ── LINHA DO TEMPO ───────────────────────────────────── */}
      {veiculos.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="font-display font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
            Linha do Tempo
          </h2>
          <TimelineColecao veiculos={veiculos} onSelectVeiculo={onSelectVeiculo} />
        </div>
      )}
    </>
  );
}
