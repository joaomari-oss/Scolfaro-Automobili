// src/hooks/useIA.ts

import { buscarValorFipe, type FipeConsultaInput } from '../services/fipeService';
import { buscarMercadoGemini, type MercadoInput, type MercadoOutput } from '../services/geminiService';
import { buscarMercadoGroq } from '../services/groqService';
import type { Veiculo } from '../types/veiculo';

// ─── Busca de Valor de Mercado com fallback automático ───────────────────────

export const buscarValorMercado = async (
  veiculo: MercadoInput
): Promise<(MercadoOutput & { iaUsada: 'gemini' | 'groq' }) | null> => {

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const groqKey   = import.meta.env.VITE_GROQ_API_KEY;

  // TENTATIVA 1: Gemini 2.5 Flash com Google Search Grounding
  if (geminiKey) {
    try {
      console.log('[IA] Tentando Gemini 2.5 Flash...');
      const resultado = await buscarMercadoGemini(veiculo, geminiKey);
      if (resultado) {
        console.log('[IA] ✓ Gemini retornou valor de mercado');
        return { ...resultado, iaUsada: 'gemini' };
      }
    } catch (err: any) {
      if (err.isRateLimit) {
        console.warn('[IA] Gemini atingiu rate limit — usando Groq como fallback');
      } else {
        console.warn('[IA] Gemini falhou:', err.message, '— usando Groq como fallback');
      }
    }
  } else {
    console.warn('[IA] VITE_GEMINI_API_KEY não definida — pulando Gemini');
  }

  // TENTATIVA 2: Groq compound-beta com web search nativo
  if (groqKey) {
    try {
      console.log('[IA] Tentando Groq compound-beta...');
      const resultado = await buscarMercadoGroq(veiculo, groqKey);
      if (resultado) {
        console.log('[IA] ✓ Groq retornou valor de mercado');
        return { ...resultado, iaUsada: 'groq' };
      }
    } catch (err: any) {
      console.error('[IA] Groq também falhou:', err.message);
    }
  } else {
    console.warn('[IA] VITE_GROQ_API_KEY não definida — fallback indisponível');
  }

  console.error('[IA] Todas as IAs falharam — valor de mercado não atualizado');
  return null;
};

// ─── Função principal de atualização completa (FIPE + Mercado) ──────────────

export const atualizarValoresVeiculo = async (
  veiculo: Veiculo,
  onProgress?: (etapa: string) => void
): Promise<{
  valorFipe: number | null;
  valorMercado: number | null;
  codigoFipe?: string;
  iaUsada?: 'gemini' | 'groq';
  erros: string[];
}> => {
  const erros: string[] = [];

  const input: MercadoInput & FipeConsultaInput = {
    marca:         veiculo.marca,
    modelo:        veiculo.modelo,
    ano:           veiculo.ano,
    quilometragem: veiculo.quilometragem,
    combustivel:   veiculo.combustivel,
    cambio:        veiculo.cambio,
    cor:           veiculo.cor,
    tipo:          veiculo.tipo,
  };

  onProgress?.('Consultando Tabela FIPE e pesquisando preços de mercado...');

  const [fipeResult, mercadoResult] = await Promise.allSettled([
    buscarValorFipe(input),
    buscarValorMercado(input),
  ]);

  const fipe    = fipeResult.status    === 'fulfilled' ? fipeResult.value    : null;
  const mercado = mercadoResult.status === 'fulfilled' ? mercadoResult.value : null;

  if (!fipe)    erros.push('FIPE não encontrada na tabela oficial');
  if (!mercado) erros.push('Valor de mercado não encontrado');

  return {
    valorFipe:    fipe?.valorFipe    ?? null,
    valorMercado: mercado?.valorMercado ?? null,
    codigoFipe:   fipe?.codigoFipe,
    iaUsada:      mercado?.iaUsada,
    erros,
  };
};
