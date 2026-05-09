import { useState } from 'react';
import { showToast } from '../Layout/Toast';
import { API_BASE } from '../../utils/api';
import { buscarMercadoGemini } from '../../services/geminiService';
import { buscarMercadoGroq } from '../../services/groqService';
import { buscarValorFipe } from '../../services/fipeService';

const GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
const GROQ_KEY   = (import.meta.env.VITE_GROQ_API_KEY   as string | undefined) ?? '';

interface AIValueFetcherProps {
  marca: string;
  modelo: string;
  ano: number | '';
  quilometragem?: number | '';
  combustivel?: string;
  onMarketValueFound: (value: number) => void;
  onFipeFound: (value: number) => void;
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';


export default function AIValueFetcher({
  marca,
  modelo,
  ano,
  quilometragem,
  combustivel,
  onMarketValueFound,
  onFipeFound,
}: AIValueFetcherProps) {
  const [marketStatus, setMarketStatus] = useState<FetchStatus>('idle');
  const [fipeStatus, setFipeStatus] = useState<FetchStatus>('idle');
  const [marketDetails, setMarketDetails] = useState<{ valorMercado: number; valorFipe: number; observacao: string } | null>(null);
  const [fipeDetails, setFipeDetails] = useState<Record<string, string | number> | null>(null);
  const [marketError, setMarketError] = useState('');
  const [fipeError, setFipeError] = useState('');

  const anoNum = Number(ano);
  const canFetch = !!(marca && modelo && ano && anoNum >= 1950 && anoNum <= new Date().getFullYear() + 1);

  const fetchMarketValue = async () => {
    if (!canFetch) return;
    setMarketStatus('loading');
    setMarketError('');

    const input = {
      marca, modelo, ano: anoNum,
      quilometragem: Number(quilometragem) || 0,
      combustivel: combustivel || 'Gasolina',
    };

    try {
      // 1. Backend — wrapped in own try/catch so network errors fall through
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE}/api/ia/buscar-valores`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input), signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) {
            const data = await res.json() as { valorMercado: number; valorFipe: number; observacao: string };
            setMarketDetails(data);
            setMarketStatus('success');
            onMarketValueFound(data.valorMercado);
            onFipeFound(data.valorFipe);
            showToast('success', 'Valores preenchidos pela IA!');
            return;
          }
        } catch {
          // backend inacessível — continua para Gemini
        }
      }

      // 2. Gemini direto
      if (GEMINI_KEY) {
        const result = await buscarMercadoGemini(
          { ...input, cambio: '', cor: '', tipo: '' },
          GEMINI_KEY
        );
        if (result) {
          const fipe = Math.round(result.valorMercado * 0.95);
          setMarketDetails({ valorMercado: result.valorMercado, valorFipe: fipe, observacao: result.observacao });
          setMarketStatus('success');
          onMarketValueFound(result.valorMercado);
          onFipeFound(fipe);
          showToast('success', 'Valores preenchidos pela IA (Gemini)!');
          return;
        }
      }

      // 3. Groq direto
      if (GROQ_KEY) {
        const result = await buscarMercadoGroq(
          { ...input, cambio: '', cor: '', tipo: '' },
          GROQ_KEY
        );
        if (result) {
          const fipe = Math.round(result.valorMercado * 0.95);
          setMarketDetails({ valorMercado: result.valorMercado, valorFipe: fipe, observacao: result.observacao });
          setMarketStatus('success');
          onMarketValueFound(result.valorMercado);
          onFipeFound(fipe);
          showToast('success', 'Valores preenchidos pela IA (Groq)!');
          return;
        }
      }

      throw new Error('Nenhuma fonte de IA disponível. Verifique as chaves de API.');
    } catch (err) {
      setMarketStatus('error');
      setMarketError(err instanceof Error ? err.message : String(err));
    }
  };

  const fetchFipe = async () => {
    if (!canFetch) return;
    setFipeStatus('loading');
    setFipeError('');
    try {
      const result = await buscarValorFipe({
        marca, modelo, ano: anoNum,
        combustivel: combustivel || 'Gasolina',
        tipo: 'sedan',
      });
      if (result) {
        setFipeDetails({ codigoFipe: result.codigoFipe, mesReferencia: result.mesReferencia });
        setFipeStatus('success');
        onFipeFound(result.valorFipe);
        showToast('success', `Valor FIPE encontrado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.valorFipe)}`);
      } else {
        setFipeStatus('error');
        setFipeError('Veículo não encontrado na tabela FIPE');
      }
    } catch (err) {
      setFipeStatus('error');
      setFipeError(err instanceof Error ? err.message : String(err));
    }
  };

  const currency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const btnStyle = (status: FetchStatus): React.CSSProperties => ({
    background: (status === 'loading' || !canFetch) ? 'var(--bg-tertiary)' : 'var(--accent-primary-muted)',
    border: `1px solid ${(!canFetch || status === 'loading') ? 'var(--border-primary)' : 'var(--accent-primary)'}`,
    color: (!canFetch || status === 'loading') ? 'var(--text-muted)' : 'var(--accent-primary)',
    borderRadius: 'var(--radius-md)',
    padding: '7px 14px',
    fontSize: 12,
    fontFamily: 'DM Sans, sans-serif',
    cursor: canFetch && status !== 'loading' ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 150ms ease',
    opacity: !canFetch ? 0.5 : 1,
  });

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px dashed var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginTop: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15 }}>🤖</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
          Buscar valores automaticamente
        </span>
      </div>

      {!canFetch && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>
          Preencha Marca, Modelo e Ano para habilitar a busca automática.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={fetchMarketValue}
          disabled={!canFetch || marketStatus === 'loading'}
          style={btnStyle(marketStatus)}
        >
          {marketStatus === 'loading' && (
            <span
              className="animate-spin"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                borderTopColor: 'transparent',
                display: 'inline-block',
              }}
            />
          )}
          {marketStatus === 'loading' ? 'Pesquisando...' : '⚡ Valor de Mercado via IA'}
        </button>

        <button
          type="button"
          onClick={fetchFipe}
          disabled={!canFetch || fipeStatus === 'loading'}
          style={btnStyle(fipeStatus)}
        >
          {fipeStatus === 'loading' && (
            <span
              className="animate-spin"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                borderTopColor: 'transparent',
                display: 'inline-block',
              }}
            />
          )}
          {fipeStatus === 'loading' ? 'Consultando FIPE...' : '📋 Consultar FIPE'}
        </button>
      </div>

      {/* AI result */}
      {marketStatus === 'success' && marketDetails && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-success)',
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ✓ Valores estimados pela IA
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>
                Mercado
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--accent-primary)', fontWeight: 500 }}>
                {currency(marketDetails.valorMercado)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>
                FIPE (estimado)
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--text-primary)', fontWeight: 500 }}>
                {currency(marketDetails.valorFipe)}
              </div>
            </div>
          </div>
          {marketDetails.observacao && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'DM Sans, sans-serif' }}>
              {marketDetails.observacao}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic', fontFamily: 'DM Sans, sans-serif' }}>
            ⚠️ Estimativa gerada por IA. Confirme ou edite os valores acima.
          </div>
        </div>
      )}

      {marketStatus === 'error' && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-danger)', fontFamily: 'DM Sans, sans-serif' }}>
          ❌ {marketError}
        </div>
      )}

      {/* FIPE result */}
      {fipeStatus === 'success' && fipeDetails && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-success)',
              fontWeight: 600,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ✓ FIPE oficial encontrada
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: 'var(--text-primary)', fontWeight: 500 }}>
            {String(fipeDetails.valor ?? fipeDetails.Valor ?? fipeDetails.price ?? '—')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'DM Sans, sans-serif' }}>
            {String(fipeDetails.mesReferencia ?? fipeDetails.MesReferencia ?? fipeDetails.referenceMonth ?? '')}
            {(fipeDetails.codigoFipe ?? fipeDetails.CodigoFipe ?? fipeDetails.codeFipe) &&
              ` · Código: ${fipeDetails.codigoFipe ?? fipeDetails.CodigoFipe ?? fipeDetails.codeFipe}`}
          </div>
        </div>
      )}

      {fipeStatus === 'error' && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-danger)', fontFamily: 'DM Sans, sans-serif' }}>
          ❌ {fipeError}
        </div>
      )}

    </div>
  );
}
