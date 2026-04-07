import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useVeiculos } from './hooks/useVeiculos';
import type { Veiculo } from './types/veiculo';
import Header from './components/Layout/Header';
import Toast, { showToast } from './components/Layout/Toast';
import VeiculoModal from './components/Modals/VeiculoModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import Inicio from './pages/Inicio';
import Acervo from './pages/Acervo';
import Valores from './pages/Valores';
import Adicionar from './pages/Adicionar';
import Favoritos from './pages/Favoritos';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { veiculos, addVeiculo, updateVeiculo, removeVeiculo, toggleFavorito } = useVeiculos();

  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [veiculoToRemove, setVeiculoToRemove] = useState<Veiculo | null>(null);

  const handleConfirmRemove = () => {
    if (veiculoToRemove) {
      removeVeiculo(veiculoToRemove.id);
      showToast('success', `${veiculoToRemove.modelo} removido.`);
      setVeiculoToRemove(null);
      if (selectedVeiculo?.id === veiculoToRemove.id) setSelectedVeiculo(null);
    }
  };

  const currentSelected = selectedVeiculo
    ? veiculos.find(v => v.id === selectedVeiculo.id) || null
    : null;

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          veiculos={veiculos}
          onSelectVeiculo={setSelectedVeiculo}
        />

        <main>
          <Routes>
            <Route path="/" element={<Inicio veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} />} />
            <Route path="/acervo" element={<Acervo veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} onToggleFavorito={toggleFavorito} onRemove={setVeiculoToRemove} />} />
            <Route path="/valores" element={<Valores veiculos={veiculos} theme={theme} onUpdateVeiculo={updateVeiculo} />} />
            <Route path="/adicionar" element={<Adicionar veiculos={veiculos} theme={theme} onAddVeiculo={addVeiculo} />} />
            <Route path="/favoritos" element={<Favoritos veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} onToggleFavorito={toggleFavorito} onRemove={setVeiculoToRemove} />} />
          </Routes>
        </main>

        {currentSelected && (
          <VeiculoModal veiculo={currentSelected} theme={theme} onClose={() => setSelectedVeiculo(null)} onUpdate={updateVeiculo} />
        )}

        {veiculoToRemove && (
          <ConfirmModal
            theme={theme}
            title="Remover veículo"
            message={`Tem certeza que deseja remover ${veiculoToRemove.modelo}? Esta ação não pode ser desfeita.`}
            onConfirm={handleConfirmRemove}
            onCancel={() => setVeiculoToRemove(null)}
          />
        )}

        <Toast theme={theme} />
      </div>
    </BrowserRouter>
  );
}
