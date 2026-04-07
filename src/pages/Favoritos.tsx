import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import VeiculoCard from '../components/Cards/VeiculoCard';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  onSelectVeiculo: (v: Veiculo) => void;
  onToggleFavorito: (id: string) => void;
  onRemove: (v: Veiculo) => void;
}

export default function Favoritos({ veiculos, theme, onSelectVeiculo, onToggleFavorito, onRemove }: Props) {
  const navigate = useNavigate();
  const favoritos = veiculos.filter(v => v.favorito);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6" fill="var(--accent-primary)" style={{ color: 'var(--accent-primary)' }} />
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Favoritos
          </h1>
          <span className="font-data text-sm" style={{ color: 'var(--text-muted)' }}>
            ({favoritos.length})
          </span>
        </div>
      </div>

      {favoritos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favoritos.map((v, i) => (
            <div key={v.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}>
              <VeiculoCard
                veiculo={v}
                theme={theme}
                onOpen={onSelectVeiculo}
                onToggleFavorito={onToggleFavorito}
                onRemove={onRemove}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fade-in py-24">
          <Star className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-display font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Nenhum favorito ainda
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Marque veículos com ⭐ no Acervo para acompanhá-los aqui
          </p>
          <button onClick={() => navigate('/acervo')} className="sa-btn-primary py-2.5">
            Ir para o Acervo
          </button>
        </div>
      )}
    </div>
  );
}
