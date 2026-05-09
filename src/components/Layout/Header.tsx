import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Moon, Search, X } from 'lucide-react';
import type { Veiculo } from '../../types/veiculo';
import BackendStatus from './BackendStatus';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  veiculos: Veiculo[];
  onSelectVeiculo: (v: Veiculo) => void;
  onOpenApresentacao: () => void;
}

export default function Header({ theme, toggleTheme, veiculos, onSelectVeiculo, onOpenApresentacao }: HeaderProps) {
  const [busca, setBusca] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resultados = busca.trim()
    ? veiculos.filter(v => {
        const q = busca.toLowerCase();
        return (
          v.modelo.toLowerCase().includes(q) ||
          v.marca.toLowerCase().includes(q) ||
          v.placa.toLowerCase().includes(q) ||
          v.ano.toString().includes(q) ||
          v.tipo.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const navItems = [
    { to: '/', label: 'Início' },
    { to: '/acervo', label: 'Acervo' },
    { to: '/valores', label: 'Valores' },
    { to: '/adicionar', label: 'Adicionar' },
    { to: '/favoritos', label: 'Favoritos' },
    { to: '/comparar', label: 'Comparar' },
    { to: '/agenda', label: 'Agenda' },
    { to: '/showroom', label: 'Showroom' },
  ];

  return (
    <header className="sa-navbar animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col leading-none">
              <span
                className="font-display font-extrabold tracking-tight text-lg"
                style={{ color: 'var(--accent-primary)' }}
              >
                SCOLFARO
              </span>
              <span
                className="font-display font-medium tracking-[0.2em] text-[10px] hidden sm:block"
                style={{ color: 'var(--text-muted)' }}
              >
                AUTOMOBILI
              </span>
            </div>
          </NavLink>

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sa-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Search + actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Mobile search toggle */}
            <button
              className="p-2 rounded-lg sm:hidden"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}
              onClick={() => setMobileSearchOpen(v => !v)}
              aria-label="Buscar"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Search — desktop */}
            <div ref={searchRef} className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Buscar veículo..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setShowResults(true); }}
                onFocus={() => { setShowResults(true); setSearchFocused(true); }}
                className="sa-input py-2 text-sm"
                style={{
                  width: searchFocused ? '300px' : '220px',
                  transition: 'width 300ms ease, border-color 150ms ease, box-shadow 150ms ease',
                  borderRadius: 'var(--radius-full)',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                }}
              />
              {showResults && busca.trim() && (
                <div
                  className="absolute top-full mt-2 left-0 w-80 rounded-xl border overflow-hidden shadow-2xl animate-fade-in-up"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-primary)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {resultados.length > 0 ? (
                    resultados.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          onSelectVeiculo(v);
                          setBusca('');
                          setShowResults(false);
                          setSearchFocused(false);
                        }}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 border-b"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          transition: 'background-color 100ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: 'var(--accent-primary-muted)' }}>
                          <span className="font-display font-bold text-xs" style={{ color: 'var(--accent-primary)' }}>
                            {v.marca.slice(0, 1)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>
                            {v.modelo}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {v.marca} · {v.ano} · {v.placa}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Nenhum resultado para "{busca}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Funcionalidades button */}
            <button
              onClick={onOpenApresentacao}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: 'var(--accent-primary-muted)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary-border)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              title="Ver funcionalidades da plataforma"
            >
              <span style={{ fontSize: 13 }}>✦</span>
              Funcionalidades
            </button>
            {/* Mobile — só ícone */}
            <button
              onClick={onOpenApresentacao}
              className="flex sm:hidden p-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-primary-muted)', color: 'var(--accent-primary)' }}
              title="Ver funcionalidades"
              aria-label="Funcionalidades"
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
            </button>

            {/* Backend status indicator */}
            <BackendStatus />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg"
              style={{
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-primary-muted)',
              }}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" style={{ transition: 'transform 400ms ease' }} />
                : <Moon className="w-4 h-4" style={{ transition: 'transform 400ms ease' }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sa-nav-link text-xs py-1 ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile search expanded */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="pb-3 sm:hidden">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                autoFocus
                type="text"
                placeholder="Buscar veículo..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setShowResults(true); }}
                className="sa-input py-2 text-sm w-full"
                style={{ paddingLeft: '36px', borderRadius: 'var(--radius-full)' }}
              />
            </div>
            {showResults && busca.trim() && (
              <div
                className="mt-2 rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}
              >
                {resultados.length > 0 ? resultados.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { onSelectVeiculo(v); setBusca(''); setShowResults(false); setMobileSearchOpen(false); }}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 border-b"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--accent-primary-muted)' }}>
                      <span className="font-display font-bold text-xs" style={{ color: 'var(--accent-primary)' }}>{v.marca.slice(0, 1)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{v.modelo}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{v.marca} · {v.ano} · {v.placa}</div>
                    </div>
                  </button>
                )) : (
                  <div className="px-4 py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum resultado</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </header>
  );
}
