import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useVeiculos } from './hooks/useVeiculos';
import type { Veiculo, Agendamento } from './types/veiculo';
import Header from './components/Layout/Header';
import Toast, { showToast } from './components/Layout/Toast';
import VeiculoModal from './components/Modals/VeiculoModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import ChatColecao from './components/Layout/ChatColecao';
import ApresentacaoModal from './components/Layout/ApresentacaoModal';
import Inicio from './pages/Inicio';
import Acervo from './pages/Acervo';
import Valores from './pages/Valores';
import Adicionar from './pages/Adicionar';
import Favoritos from './pages/Favoritos';
import Comparar from './pages/Comparar';
import Agenda from './pages/Agenda';
import Showroom from './pages/Showroom';
import PerfilPublico from './pages/PerfilPublico';
import VeiculoPublico from './pages/VeiculoPublico';
import { agendamentosDB } from './services/veiculosDB';
import { supabaseDisponivel } from './lib/supabase';

const AGENDA_KEY = 'scolfaro_agendamentos';

function lsListarAgenda(): Agendamento[] {
  try { return JSON.parse(localStorage.getItem(AGENDA_KEY) ?? '[]'); }
  catch { return []; }
}
function lsSalvarAgenda(lista: Agendamento[]): void {
  localStorage.setItem(AGENDA_KEY, JSON.stringify(lista));
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [showApresentacao, setShowApresentacao] = useState(false);
  const { veiculos, loading, erro, adicionar, atualizar, remover, toggleFavorito, atualizarValores, adicionarGasto, editarGasto, removerGasto } = useVeiculos();
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [veiculoToRemove, setVeiculoToRemove] = useState<Veiculo | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(lsListarAgenda);

  // Carregar agendamentos do Supabase na inicialização
  useEffect(() => {
    if (!supabaseDisponivel) return;
    agendamentosDB.listar()
      .then(lista => {
        setAgendamentos(lista);
        lsSalvarAgenda(lista); // sincroniza localStorage
      })
      .catch(() => {
        // fallback: já carregou do localStorage no useState
      });
  }, []);

  const salvarAgendamento = async (ag: Agendamento) => {
    // Otimista: atualiza UI primeiro
    setAgendamentos(prev => {
      const existe = prev.find(a => a.id === ag.id);
      const next = existe ? prev.map(a => a.id === ag.id ? ag : a) : [ag, ...prev];
      lsSalvarAgenda(next);
      return next;
    });
    // Persiste no Supabase
    if (supabaseDisponivel) {
      try { await agendamentosDB.salvar(ag); }
      catch (e) { console.error('Erro ao salvar agendamento no Supabase:', e); }
    }
  };

  const removerAgendamento = async (id: string) => {
    setAgendamentos(prev => {
      const next = prev.filter(a => a.id !== id);
      lsSalvarAgenda(next);
      return next;
    });
    if (supabaseDisponivel) {
      try { await agendamentosDB.remover(id); }
      catch (e) { console.error('Erro ao remover agendamento no Supabase:', e); }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p className="font-display text-sm" style={{ color: 'var(--text-muted)' }}>Carregando acervo...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Erro ao conectar</p>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>{erro}</p>
      </div>
    );
  }

  const handleAddVeiculo = async (v: Veiculo): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...semId } = v;
      await adicionar(semId);
    } catch (err) {
      console.error('Erro inesperado ao adicionar veículo:', err);
      showToast('error', 'Erro ao salvar veículo. Tente novamente.');
      throw err; // re-lança para o handleSave em Adicionar.tsx
    }
  };

  const handleConfirmRemove = async () => {
    if (veiculoToRemove) {
      await remover(veiculoToRemove.id);
      showToast('success', `${veiculoToRemove.modelo} removido.`);
      setVeiculoToRemove(null);
      if (selectedVeiculo?.id === veiculoToRemove.id) setSelectedVeiculo(null);
    }
  };

  const currentSelected = selectedVeiculo
    ? veiculos.find(v => v.id === selectedVeiculo.id) || null
    : null;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          veiculos={veiculos}
          onSelectVeiculo={setSelectedVeiculo}
          onOpenApresentacao={() => setShowApresentacao(true)}
        />

        {!supabaseDisponivel && (
          <div style={{
            backgroundColor: '#7c3aed22',
            borderBottom: '1px solid #7c3aed55',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            color: '#c4b5fd',
            textAlign: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span>
              <strong>Banco de dados não configurado</strong> — dados salvos só neste dispositivo.
              Configure <code style={{ backgroundColor: '#ffffff15', padding: '1px 5px', borderRadius: 4 }}>VITE_SUPABASE_URL</code> e <code style={{ backgroundColor: '#ffffff15', padding: '1px 5px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code> no Vercel para sincronizar entre dispositivos.
            </span>
          </div>
        )}

        <main>
          <Routes>
            <Route path="/" element={<Inicio veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} />} />
            <Route path="/acervo" element={<Acervo veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} onToggleFavorito={toggleFavorito} onRemove={setVeiculoToRemove} />} />
            <Route path="/valores" element={<Valores veiculos={veiculos} theme={theme} onAtualizarValores={atualizarValores} onUpdateVeiculo={atualizar} />} />
            <Route path="/adicionar" element={<Adicionar veiculos={veiculos} theme={theme} onAddVeiculo={handleAddVeiculo} />} />
            <Route path="/favoritos" element={<Favoritos veiculos={veiculos} theme={theme} onSelectVeiculo={setSelectedVeiculo} onToggleFavorito={toggleFavorito} onRemove={setVeiculoToRemove} />} />
            <Route path="/comparar" element={<Comparar veiculos={veiculos} theme={theme} />} />
            <Route path="/agenda" element={
              <Agenda
                veiculos={veiculos}
                agendamentos={agendamentos}
                onSalvarAgendamento={salvarAgendamento}
                onRemoverAgendamento={removerAgendamento}
              />
            } />
            <Route path="/showroom" element={<Showroom veiculos={veiculos} />} />
            <Route path="/publico" element={<PerfilPublico veiculos={veiculos} />} />
            <Route path="/veiculo/:id" element={<VeiculoPublico veiculos={veiculos} />} />
          </Routes>
        </main>

        {currentSelected && (
          <VeiculoModal
            veiculo={currentSelected}
            theme={theme}
            onClose={() => setSelectedVeiculo(null)}
            onUpdate={atualizar}
            onAtualizarValores={atualizarValores}
            onAdicionarGasto={adicionarGasto}
            onEditarGasto={editarGasto}
            onRemoverGasto={removerGasto}
          />
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

        <ChatColecao veiculos={veiculos} />
        <Toast theme={theme} />

        {showApresentacao && (
          <ApresentacaoModal onClose={() => setShowApresentacao(false)} />
        )}
      </div>
    </BrowserRouter>
  );
}
