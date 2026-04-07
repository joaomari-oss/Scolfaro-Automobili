import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../Layout/Toast';

interface Props {
  veiculos: Veiculo[];
  selectedIds: string[];
  colorMap: Record<string, string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A5A5A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

export default function VeiculoSeletor({
  veiculos,
  selectedIds,
  colorMap,
  onToggle,
  onSelectAll,
  onClearAll,
}: Props) {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [marcaFiltro, setMarcaFiltro] = useState('Todas');
  const [expandido, setExpandido] = useState(false);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id) && selectedIds.length <= 1) {
      showToast('error', 'Selecione ao menos 1 veículo');
      return;
    }
    onToggle(id);
  };

  const marcas = useMemo(() => {
    return Array.from(new Set(veiculos.map(v => v.marca))).sort();
  }, [veiculos]);

  const filtrados = useMemo(() => {
    return veiculos.filter(v => {
      const q = busca.trim().toLowerCase();
      const passaBusca = !q || v.modelo.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q);
      const passaTipo =
        tipoFiltro === 'Todos' ||
        (tipoFiltro === 'Moto' ? v.tipo === 'moto' : v.tipo !== 'moto');
      const passaMarca = marcaFiltro === 'Todas' || v.marca === marcaFiltro;
      return passaBusca && passaTipo && passaMarca;
    });
  }, [veiculos, busca, tipoFiltro, marcaFiltro]);

  const filtrosAtivos = busca.trim() !== '' || tipoFiltro !== 'Todos' || marcaFiltro !== 'Todas';
  // Auto-expand when filters are active so results are always fully visible
  const mostrarExpandido = expandido || filtrosAtivos;

  const selectStyle = (ativo: boolean): React.CSSProperties => ({
    height: 32,
    padding: '0 28px 0 10px',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
    backgroundColor: 'var(--bg-tertiary)',
    border: `1px solid ${ativo ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: CHEVRON_SVG,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  });

  return (
    <div
      className="rounded-xl border p-5 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          Selecionar Veículos para os Gráficos
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onSelectAll}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Selecionar todos
          </button>
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              fontFamily: 'DM Sans, sans-serif',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Limpar seleção
          </button>
          <span
            style={{
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
              color: 'var(--text-secondary)',
            }}
          >
            {selectedIds.length} de {veiculos.length} selecionados
          </span>
        </div>
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Buscar veículo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              height: 32,
              paddingLeft: 30,
              paddingRight: 10,
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: 220,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tipo select */}
        <div style={{ position: 'relative' }}>
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            style={selectStyle(tipoFiltro !== 'Todos')}
          >
            <option value="Todos">Todos</option>
            <option value="Carro">Carro</option>
            <option value="Moto">Moto</option>
          </select>
          {tipoFiltro !== 'Todos' && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Marca select */}
        <div style={{ position: 'relative' }}>
          <select
            value={marcaFiltro}
            onChange={e => setMarcaFiltro(e.target.value)}
            style={selectStyle(marcaFiltro !== 'Todas')}
          >
            <option value="Todas">Todas</option>
            {marcas.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {marcaFiltro !== 'Todas' && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Chips */}
      {filtrados.length === 0 ? (
        <p style={{ fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: 'var(--text-muted)' }}>
          Nenhum veículo encontrado
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              overflow: 'hidden',
              maxHeight: mostrarExpandido ? 2000 : 76,
              transition: 'max-height 300ms ease',
            }}
          >
            {filtrados.map(v => {
              const selected = selectedIds.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleToggle(v.id)}
                  style={{
                    minWidth: 130,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                    background: selected ? 'var(--accent-primary-muted)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 200ms ease',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {/* Dot + model name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: selected ? (colorMap[v.id] ?? 'var(--accent-primary)') : 'var(--text-muted)',
                        flexShrink: 0,
                        transition: 'background-color 200ms ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: selected ? 600 : 400,
                        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 110,
                        transition: 'color 200ms ease',
                      }}
                    >
                      {v.modelo.length > 17 ? v.modelo.slice(0, 17) + '…' : v.modelo}
                    </span>
                  </div>
                  {/* Brand · year */}
                  <span
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      paddingLeft: 14,
                    }}
                  >
                    {v.marca} · {v.ano}
                  </span>
                  {/* Value */}
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: selected ? 'var(--accent-primary)' : 'var(--text-muted)',
                      paddingLeft: 14,
                      transition: 'color 200ms ease',
                    }}
                  >
                    {formatCurrency(v.valorMercado)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expand / collapse toggle — only shown when no filters are active */}
          {!filtrosAtivos && (
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setExpandido(prev => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {expandido ? 'Ver menos' : `Ver todos (${veiculos.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
