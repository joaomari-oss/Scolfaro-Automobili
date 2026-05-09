/**
 * D4 – AnunciosSimilares
 * Busca e exibe anúncios similares no mercado via Gemini.
 */
import { useState } from 'react';
import { ExternalLink, RefreshCw, ShoppingCart } from 'lucide-react';
import type { Veiculo } from '../../types/veiculo';
import { buscarAnunciosSimilares, type AnuncioSimilar } from '../../services/anunciosService';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculo: Veiculo;
}

export default function AnunciosSimilares({ veiculo }: Props) {
  const [anuncios, setAnuncios] = useState<AnuncioSimilar[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async () => {
    setLoading(true);
    const resultado = await buscarAnunciosSimilares(
      veiculo.marca, veiculo.modelo, veiculo.ano, veiculo.valorMercado
    );
    setAnuncios(resultado);
    setBuscado(true);
    setLoading(false);
  };

  if (!buscado) {
    return (
      <div className="text-center py-8 space-y-4">
        <ShoppingCart className="w-10 h-10 mx-auto" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Compare com anúncios reais no mercado para saber se o preço está competitivo.
        </p>
        <button className="sa-btn-primary" onClick={handleBuscar} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Buscando...' : 'Buscar anúncios via IA'}
        </button>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Usa Gemini Search Grounding — requer chave Gemini configurada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {anuncios.length > 0
            ? `${anuncios.length} anúncios encontrados`
            : 'Nenhum anúncio encontrado'
          }
        </h3>
        <button className="sa-btn-ghost text-xs" onClick={handleBuscar} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {anuncios.length > 0 && (
        <>
          {/* Resumo vs valor da coleção */}
          {(() => {
            const media = anuncios.reduce((s, a) => s + a.preco, 0) / anuncios.length;
            const diff = veiculo.valorMercado - media;
            return (
              <div
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Média dos anúncios: <strong className="font-data" style={{ color: 'var(--text-primary)' }}>{formatCurrency(media)}</strong>
                </span>
                <span
                  className="text-xs font-semibold font-data"
                  style={{ color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {diff >= 0 ? 'Acima' : 'Abaixo'} {Math.abs(diff / media * 100).toFixed(1)}% da média
                </span>
              </div>
            );
          })()}

          <div className="space-y-3">
            {anuncios.map((a, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {a.titulo}
                    </p>
                    <p className="text-xs mt-0.5 font-data" style={{ color: 'var(--text-muted)' }}>
                      {a.ano && `${a.ano} · `}{a.km && `${a.km} · `}{a.fonte}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-data font-bold text-sm" style={{ color: 'var(--accent-primary)' }}>
                      {formatCurrency(a.preco)}
                    </p>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 mt-1"
                        style={{ color: 'var(--color-info)' }}
                      >
                        Ver anúncio <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
