// src/services/groqService.ts

import type { MercadoInput, MercadoOutput } from './geminiService';

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'compound-beta';

const montarPromptMercadoGroq = (v: MercadoInput): string => `
Você é um avaliador especialista em veículos usados no mercado brasileiro.
Pesquise na web o valor de mercado ATUAL deste veículo:

VEÍCULO: ${v.marca} ${v.modelo} ${v.ano}
QUILOMETRAGEM: ${v.quilometragem.toLocaleString('pt-BR')} km
COMBUSTÍVEL: ${v.combustivel} | CÂMBIO: ${v.cambio} | COR: ${v.cor}

Pesquise em: webmotors.com.br, olx.com.br, icarros.com.br
Colete preços reais e calcule a média ajustada pela quilometragem.
Retorne APENAS JSON válido:

{"valorMercado":000000,"observacao":"texto breve"}

valorMercado = número inteiro em reais sem pontuação.
`.trim();

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
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: montarPromptMercadoGroq(veiculo) }],
        temperature: 0.1,
        max_tokens: 512,
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
    if (typeof resultado.valorMercado !== 'number') throw new Error('valorMercado inválido');

    return {
      valorMercado: Math.round(resultado.valorMercado),
      observacao: resultado.observacao ?? '',
      fonte: 'Groq compound-beta + Web Search',
    };

  } catch (err: any) {
    console.error('[Groq] Erro:', err.message);
    return null;
  }
};
