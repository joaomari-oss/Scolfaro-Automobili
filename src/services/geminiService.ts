// src/services/geminiService.ts

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface MercadoInput {
  marca: string;
  modelo: string;
  ano: number;
  quilometragem: number;
  combustivel: string;
  cambio: string;
  cor: string;
  tipo: string;
}

export interface MercadoOutput {
  valorMercado: number;
  observacao: string;
  fonte: string;
}

const montarPromptMercado = (v: MercadoInput): string => `
Você é um avaliador especialista em veículos usados no mercado brasileiro.
Pesquise no Google o valor de mercado ATUAL deste veículo específico:

DADOS COMPLETOS DO VEÍCULO:
- Marca: ${v.marca}
- Modelo: ${v.modelo}
- Ano: ${v.ano}
- Quilometragem: ${v.quilometragem.toLocaleString('pt-BR')} km
- Combustível: ${v.combustivel}
- Câmbio: ${v.cambio}
- Cor: ${v.cor}
- Tipo: ${v.tipo}

INSTRUÇÕES:
1. Pesquise preços reais em: Webmotors, OLX Autos e iCarros
2. Use todos os dados acima para refinar a busca (não apenas marca e modelo)
3. Colete pelo menos 3 preços de anúncios reais
4. Calcule a média ajustada pela quilometragem (${v.quilometragem.toLocaleString('pt-BR')} km):
   - Abaixo de 30.000 km: +5% a +10% sobre a média
   - Acima de 100.000 km: -5% a -15% sobre a média
5. Retorne APENAS JSON válido, sem markdown, sem explicações:

{"valorMercado":000000,"precosEncontrados":[000000,000000],"sitesConsultados":["webmotors"],"observacao":"Baseado em X anúncios. Ajuste de Y% pela quilometragem."}

valorMercado deve ser número inteiro em reais sem pontuação.
`.trim();

export const buscarMercadoGemini = async (
  veiculo: MercadoInput,
  apiKey: string
): Promise<MercadoOutput | null> => {
  try {
    const response = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: montarPromptMercado(veiculo) }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      if (response.status === 429) throw Object.assign(new Error('RATE_LIMIT'), { isRateLimit: true });
      throw new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(errBody)}`);
    }

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Gemini retornou resposta vazia');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON não encontrado na resposta Gemini');

    const resultado = JSON.parse(jsonMatch[0]);
    if (typeof resultado.valorMercado !== 'number') throw new Error('valorMercado inválido');

    return {
      valorMercado: Math.round(resultado.valorMercado),
      observacao: resultado.observacao ?? '',
      fonte: 'Gemini 2.5 Flash + Google Search',
    };

  } catch (err) {
    if ((err as { isRateLimit?: boolean }).isRateLimit) throw err;
    console.error('[Gemini] Erro:', err instanceof Error ? err.message : String(err));
    return null;
  }
};
