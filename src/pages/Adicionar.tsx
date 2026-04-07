import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import AddVeiculoForm from '../components/Forms/AddVeiculoForm';
import { showToast } from '../components/Layout/Toast';

interface Props {
  veiculos: Veiculo[];
  theme: 'dark' | 'light';
  onAddVeiculo: (v: Veiculo) => void;
}

export default function Adicionar({ veiculos, theme, onAddVeiculo }: Props) {
  const navigate = useNavigate();
  const marcasExistentes = [...new Set(veiculos.map(v => v.marca))].sort();

  const handleSave = (v: Veiculo) => {
    onAddVeiculo(v);
    showToast('success', `${v.modelo} adicionado com sucesso!`);
    navigate('/acervo');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Back + title */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border"
          style={{
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary-border)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Adicionar Veículo
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Preencha os dados do novo veículo do acervo
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="p-6 sm:p-8 rounded-2xl border animate-fade-in-up stagger-1"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <AddVeiculoForm
          theme={theme}
          marcasExistentes={marcasExistentes}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
