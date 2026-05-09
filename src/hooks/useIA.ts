// src/hooks/useIA.ts
// Estratégia em cascata:
// 1. Backend Render (se VITE_API_URL estiver configurado)
// 2. Gemini 2.5 Flash direto do frontend (VITE_GEMINI_API_KEY)
// 3. Groq compound-beta direto do frontend (VITE_GROQ_API_KEY)
// 4. Estimativa local

import type { Veiculo } from '../types/veiculo';
import { buscarMercadoGemini } from '../services/geminiService';
import { buscarMercadoGroq } from '../services/groqService';
import { buscarValorFipe } from '../services/fipeService';
import { API_BASE, backendDisponivel } from '../utils/api';

const GEMINI_KEY   = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
const GROQ_KEY     = (import.meta.env.VITE_GROQ_API_KEY   as string | undefined) ?? '';

// ─── Fallback local (quando o backend está totalmente indisponível) ───────────
const BASE_POR_MARCA: Record<string, number> = {
  ferrari: 2_100_000, lamborghini: 2_600_000, porsche: 950_000,
  mclaren: 2_300_000, maserati: 780_000, 'land rover': 650_000,
  'range rover': 900_000, mercedes: 380_000, bmw: 320_000,
  audi: 290_000, volvo: 260_000, toyota: 180_000, honda: 160_000,
  jeep: 210_000, volkswagen: 135_000, chevrolet: 125_000, fiat: 95_000,
};

function estimarLocalmente(veiculo: Veiculo): { valorFipe: number; valorMercado: number } {
  const idade = Math.max(0, new Date().getFullYear() - veiculo.ano);
  const km    = veiculo.quilometragem || 0;
  const marca = veiculo.marca.toLowerCase();
  const base  = Object.entries(BASE_POR_MARCA).find(([k]) => marca.includes(k))?.[1] ?? 120_000;
  const dep   = Math.max(0.4, 1 - idade * 0.05);
  const ajKm  = km < 30_000 ? 1.05 : km < 80_000 ? 1 : km < 150_000 ? 0.93 : 0.85;
  const valorFipe    = Math.round(base * dep);
  const valorMercado = Math.round(valorFipe * ajKm * 1.04);
  return { valorFipe, valorMercado };
}

// ─── Função principal de atualização completa ────────────────────────────────

export const atualizarValoresVeiculo = async (
  veiculo: Veiculo,
  onProgress?: (etapa: string) => void,
): Promise<{
  valorFipe: number | null;
  valorMercado: number | null;
  codigoFipe?: string;
  iaUsada?: 'gemini' | 'groq';
  erros: string[];
}> => {
  onProgress?.('Consultando IA para valores atualizados...');

  const input = {
    marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano,
    quilometragem: veiculo.quilometragem, combustivel: veiculo.combustivel,
    cambio: veiculo.cambio ?? '', cor: veiculo.cor ?? '', tipo: veiculo.tipo,
  };

  // ── 1. Backend Render (opcional) ─────────────────────────────────────────
  if (API_BASE && await backendDisponivel()) {
    try {
      const res = await fetch(`${API_BASE}/api/ia/buscar-valores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const data = await res.json() as { valorMercado: number; valorFipe: number; iaUsada?: string };
        console.info(`[IA] ✓ Backend respondeu (fonte: ${data.iaUsada ?? 'desconhecida'})`);
        return {
          valorFipe: data.valorFipe, valorMercado: data.valorMercado,
          iaUsada: data.iaUsada === 'local' ? undefined : data.iaUsada as 'gemini' | 'groq' | undefined,
          erros: [],
        };
      }
    } catch {
      console.warn('[IA] Backend indisponível, tentando direto...');
    }
  }

  // ── 2. Gemini 2.5 Flash direto ──────────────────────────────────────────
  if (GEMINI_KEY) {
    try {
      onProgress?.('Consultando Gemini 2.5 Flash...');
      const result = await buscarMercadoGemini(input, GEMINI_KEY);
      if (result) {
        // Tenta FIPE direto também
        let valorFipe: number | null = null;
        let codigoFipe: string | undefined;
        try {
          const fipe = await buscarValorFipe({
            marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano,
            combustivel: veiculo.combustivel, tipo: veiculo.tipo,
          });
          if (fipe) { valorFipe = fipe.valorFipe; codigoFipe = fipe.codigoFipe; }
        } catch { /* FIPE opcional */ }
        if (!valorFipe) valorFipe = Math.round(result.valorMercado * 0.95);
        console.info('[IA] ✓ Gemini respondeu diretamente');
        return { valorMercado: result.valorMercado, valorFipe, codigoFipe, iaUsada: 'gemini', erros: [] };
      }
    } catch (err) {
      console.warn('[IA] Gemini falhou:', err instanceof Error ? err.message : err);
    }
  }

  // ── 3. Groq compound-beta direto ─────────────────────────────────────────
  if (GROQ_KEY) {
    try {
      onProgress?.('Consultando Groq...');
      const result = await buscarMercadoGroq(input, GROQ_KEY);
      if (result) {
        const estimativa = estimarLocalmente(veiculo);
        console.info('[IA] ✓ Groq respondeu diretamente');
        return { valorMercado: result.valorMercado, valorFipe: estimativa.valorFipe, iaUsada: 'groq', erros: [] };
      }
    } catch (err) {
      console.warn('[IA] Groq falhou:', err instanceof Error ? err.message : err);
    }
  }

  // ── 4. Estimativa local ──────────────────────────────────────────────────
  console.warn('[IA] Todas as fontes falharam — usando estimativa local');
  const estimativa = estimarLocalmente(veiculo);
  return {
    valorFipe: estimativa.valorFipe, valorMercado: estimativa.valorMercado,
    iaUsada: undefined,
    erros: ['IAs indisponíveis — valores estimados localmente'],
  };
};
