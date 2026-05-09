// src/services/groqService.ts

import type { MercadoInput, MercadoOutput } from './geminiService';

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'compound-beta';

const montarPromptMercadoGroq = (v: MercadoInput): string => {
  const anoAtual = new Date().getFullYear();
  return `
Busque na web o preço atual de venda de um ${v.marca} ${v.modelo} ${v.ano} no Brasil em ${anoAtual}.

Pesquise em webmotors.com.br, icarros.com.br e olx.com.br por "${v.marca} ${v.modelo} ${v.ano} venda".
Dados do veículo: ${v.quilometragem.toLocaleString('pt-BR')} km, ${v.combustivel}.

APÓS encontrar os preços reais, retorne SOMENTE este JSON (sem markdown, sem texto adicional):
{"valorMercado": PRECO_MEDIO_EM_REAIS, "observacao": "Baseado em anúncios de SITE em MES/ANO"}

valorMercado = número inteiro em reais SEM pontos ou vírgulas. Para R$ 850.000 retorne 850000.
NÃO use valores da sua memória. Use APENAS preços encontrados na busca agora.
`.trim();
};

export const buscarMercadoGroq = async (
  veiculo: MercadoInput,
  apiKey: string
): Promise<MercadoOutput | null> => {
  try {
    const response = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: montarPromptMercadoGroq(veiculo) }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(`Groq HTTP ${response.status}: ${JSON.stringify(errBody)}`);
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Groq retornou resposta vazia');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON não encontrado na resposta Groq');

    const resultado = JSON.parse(jsonMatch[0]);
    const raw = resultado.valorMercado;
    const valor = typeof raw === 'number' ? raw
      : typeof raw === 'string' ? parseFloat(raw.replace(/\./g, '').replace(',', '.')) : NaN;
    console.log('[Groq] valorMercado raw:', raw, '\u2192 parsed:', valor);
    if (!valor || isNaN(valor) || valor < 1000) throw new Error(`valorMercado inv\u00e1lido: ${raw}`);

    return {
      valorMercado: Math.round(valor),
      observacao: resultado.observacao ?? '',
      fonte: 'Groq compound-beta + Web Search',
    };

  } catch (err) {
    console.error('[Groq] Erro:', err instanceof Error ? err.message : String(err));
    return null;
  }
};
