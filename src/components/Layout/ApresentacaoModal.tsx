import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const features = [
  { icon: '🏎️', name: 'Acervo Completo', desc: 'Cadastro detalhado de cada veículo com fotos, ficha técnica, histórico e documentação.' },
  { icon: '⭐', name: 'Favoritos', desc: 'Marque e acesse rapidamente os veículos mais relevantes do acervo.' },
  { icon: '⚖️', name: 'Comparação de Veículos', desc: 'Compare dois ou mais veículos lado a lado com dados técnicos e financeiros.' },
  { icon: '📈', name: 'Gestão de Valores', desc: 'Rastreamento de valor de mercado, histórico de valorização e análise de investimento.' },
  { icon: '💰', name: 'Controle de Gastos', desc: 'Registro de despesas por veículo — manutenção, revisões e melhorias com relatório consolidado.' },
  { icon: '📅', name: 'Agenda de Manutenção', desc: 'Agendamentos com status de acompanhamento para nunca perder uma revisão programada.' },
  { icon: '🖼️', name: 'Showroom Público', desc: 'Vitrine pública elegante para apresentar o acervo a clientes e colecionadores.' },
  { icon: '🔗', name: 'Compartilhamento por Token', desc: 'Cada veículo gera um link exclusivo com QR Code para compartilhamento direto.' },
  { icon: '📄', name: 'Exportação em PDF', desc: 'Gere documentos PDF profissionais de cada veículo — ficha completa para negociações.' },
  { icon: '📊', name: 'Analytics & Gráficos', desc: 'Dashboards com gráficos de valorização, gastos por categoria e visão geral do portfólio.' },
  { icon: '🌙', name: 'Tema Claro / Escuro', desc: 'Alternância entre tema escuro sofisticado e tema claro, com preferência salva automaticamente.' },
  { icon: '☁️', name: 'Sincronização em Nuvem', desc: 'Dados em PostgreSQL via Supabase — acessível de qualquer dispositivo, sempre.' },
  { icon: '🔍', name: 'Busca & Filtros Avançados', desc: 'Localize qualquer veículo por marca, modelo, ano, valor ou qualquer atributo instantaneamente.' },
  { icon: '📱', name: '100% Responsivo', desc: 'Interface perfeita em qualquer tela — desktop, tablet ou smartphone.' },
  { icon: '🛡️', name: 'Perfil Público Configurável', desc: 'Apresente sua identidade e acervo de forma controlada ao público.' },
  { icon: '🚀', name: 'Performance de Elite', desc: 'Carregamento ultrarrápido com Vite + React 19, bundle otimizado para entrega imediata.' },
  { icon: '🗂️', name: 'Ficha Técnica Completa', desc: 'Motor, potência, câmbio, tração, carroceria — organizados com precisão por veículo.' },
  { icon: '🔔', name: 'Notificações em Tempo Real', desc: 'Sistema de toasts que confirmam cada ação imediatamente.' },
  { icon: '🤖', name: 'Avaliação por Inteligência Artificial', desc: 'Gemini 2.5 Flash + Groq pesquisam o mercado em tempo real e estimam o valor de cada veículo.' },
  { icon: '🏷️', name: 'Integração FIPE', desc: 'Consulta e armazena o valor FIPE oficial com comparativo direto ao preço de mercado.' },
];

const pages = [
  { num: '01', name: 'Início', desc: 'Dashboard com visão geral do acervo e acesso rápido às seções.' },
  { num: '02', name: 'Acervo', desc: 'Galeria completa com busca, filtros e visualização em grade ou lista.' },
  { num: '03', name: 'Favoritos', desc: 'Coleção de veículos marcados para acesso prioritário.' },
  { num: '04', name: 'Comparar', desc: 'Análise comparativa lado a lado entre veículos selecionados.' },
  { num: '05', name: 'Valores', desc: 'Gestão financeira com histórico de valorização e análise de gastos.' },
  { num: '06', name: 'Adicionar Veículo', desc: 'Formulário completo para cadastro com todos os campos técnicos.' },
  { num: '07', name: 'Agenda', desc: 'Calendário de manutenções com controle de status e histórico.' },
  { num: '08', name: 'Showroom Público', desc: 'Vitrine elegante aberta ao público para exposição curada do acervo.' },
  { num: '09', name: 'Perfil Público', desc: 'Página de apresentação da Scolfaro Automobili com identidade e contato.' },
  { num: '10', name: 'Veículo Público', desc: 'Página individual acessível via token ou QR Code — sem necessidade de login.' },
];

const stack = [
  { name: 'React 19', color: '#61DAFB', desc: 'Biblioteca UI, componentes funcionais com hooks' },
  { name: 'TypeScript 6', color: '#3178C6', desc: 'Tipagem estática — zero bugs silenciosos em produção' },
  { name: 'TailwindCSS 4', color: '#38BDF8', desc: 'Estilização moderna com design system em CSS vars' },
  { name: 'Supabase', color: '#3ECF8E', desc: 'PostgreSQL em nuvem — dados sincronizados em tempo real' },
  { name: 'Vite 8', color: '#F5C400', desc: 'Bundler ultrarrápido — build em menos de 1 segundo' },
  { name: 'React Router 7', color: '#CA4245', desc: 'Roteamento SPA com navegação client-side fluida' },
  { name: 'Recharts', color: '#8884D8', desc: 'Gráficos interativos de valorização e analytics' },
  { name: 'React PDF', color: '#EF4444', desc: 'Geração de documentos PDF profissionais por veículo' },
  { name: 'Gemini + Groq IA', color: '#A78BFA', desc: 'Avaliação de mercado por inteligência artificial' },
];

export default function ApresentacaoModal({ onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 320);
  };

  useEffect(() => {
    // Monta com micro-delay para o browser aplicar o transition
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: closing ? 'rgba(0,0,0,0)' : visible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        backdropFilter: visible && !closing ? 'blur(8px)' : 'blur(0px)',
        overflowY: 'auto',
        padding: 'clamp(0.5rem, 3vw, 2rem) clamp(0.5rem, 3vw, 1rem)',
        transition: 'background-color 320ms ease, backdrop-filter 320ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 20,
          border: '1px solid var(--border-primary)',
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
          position: 'relative',
          opacity: closing ? 0 : visible ? 1 : 0,
          transform: closing ? 'scale(0.95) translateY(16px)' : visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(24px)',
          transition: 'opacity 320ms cubic-bezier(0.16,1,0.3,1), transform 320ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,196,0,0.08) 0%, transparent 60%)',
          borderBottom: '1px solid var(--border-primary)',
          padding: 'clamp(1.25rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 8,
            }}>
              Scolfaro <span style={{ color: 'var(--accent-primary)' }}>Automobili</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(13px, 2vw, 15px)', maxWidth: 560 }}>
              Plataforma digital completa para gestão e vitrine de acervos automotivos de alto padrão —
              20 funcionalidades, 10 páginas, build 100% limpo.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
              backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}            
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          {[
            { val: '20', label: 'Funcionalidades' },
            { val: '10', label: 'Páginas' },
            { val: '0', label: 'Erros TypeScript' },
            { val: '<1s', label: 'Tempo de Build' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)', textAlign: 'center',
              borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none',
              borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '2rem',
                color: 'var(--accent-primary)', lineHeight: 1, marginBottom: 4,
              }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 'clamp(1rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(1.5rem, 4vw, 2.5rem)' }}>

          {/* Features */}
          <div>
            <SectionLabel>Funcionalidades</SectionLabel>
            <h2 style={sectionTitle}>20 funcionalidades entregues</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 1,
              border: '1px solid var(--border-primary)',
              borderRadius: 12, overflow: 'hidden', marginTop: 16,
            }}>
              {features.map(f => (
                <div key={f.name} style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1.25rem',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{f.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{f.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <SectionLabel>Navegação</SectionLabel>
            <h2 style={sectionTitle}>10 páginas construídas</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 8, marginTop: 16,
            }}>
              {pages.map(p => (
                <div key={p.num} style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 10, padding: '1rem',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                    color: 'var(--border-primary)', lineHeight: 1, minWidth: 28, flexShrink: 0,
                  }}>{p.num}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div>
            <SectionLabel>Tecnologia</SectionLabel>
            <h2 style={sectionTitle}>Stack escolhido para durar</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
              {stack.map(t => (
                <div key={t.name} style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: t.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', minWidth: 160, flexShrink: 0 }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,196,0,0.06) 0%, transparent 100%)',
            border: '1px solid rgba(245,196,0,0.15)',
            borderRadius: 12, padding: 'clamp(1.25rem, 4vw, 2rem)',
            textAlign: 'center',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              color: 'var(--text-primary)', marginBottom: 8,
            }}>
              Pronto para <span style={{ color: 'var(--accent-primary)' }}>rodar.</span>
            </h3>
            <button
              onClick={handleClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'var(--accent-primary)', color: '#000',
                borderRadius: 8, padding: '10px 24px', border: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Voltar para a plataforma →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6,
    }}>
      {children}
    </p>
  );
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
  color: 'var(--text-primary)',
  lineHeight: 1.2,
};
