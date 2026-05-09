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

const montarPromptMercado = (v: MercadoInput): string => {
  const anoAtual = new Date().getFullYear();
  return `
Busque AGORA no Google o preço de venda de um ${v.marca} ${v.modelo} ${v.ano} no Brasil em ${anoAtual}.

Pesquise especificamente:
- "${v.marca} ${v.modelo} ${v.ano} venda" no webmotors.com.br
- "${v.marca} ${v.modelo} ${v.ano} venda" no icarros.com.br
- "${v.marca} ${v.modelo} ${v.ano} venda" no olx.com.br

Dados adicionais do veículo: ${v.quilometragem.toLocaleString('pt-BR')} km, ${v.combustivel}, ${v.cambio}.

APÓS buscar os preços reais nos sites, retorne SOMENTE este JSON (sem markdown, sem texto antes ou depois):
{"valorMercado": PRECO_MEDIO_EM_REAIS, "observacao": "Baseado em anúncios reais de SITE em MES/ANO"}

valorMercado = número inteiro, em reais, SEM pontos ou vírgulas. Exemplo para carro de R$ 850.000: 850000
NÃO use valores da sua memória. Use APENAS os preços encontrados na busca agora.
`.trim();
};

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
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: montarPromptMercado(veiculo) }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
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
    // Com googleSearch, o Gemini pode retornar multiplos parts — iterar todos
    const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? [];
    const text: string = parts.map(p => p.text ?? '').join('');
    if (!text) throw new Error('Gemini retornou resposta vazia');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON não encontrado na resposta Gemini');

    const resultado = JSON.parse(jsonMatch[0]);
    // Aceita tanto number quanto string (ex: "850000" ou "850.000")
    const raw = resultado.valorMercado;
    const valor = typeof raw === 'number' ? raw
      : typeof raw === 'string' ? parseFloat(raw.replace(/\./g, '').replace(',', '.')) : NaN;
    console.log('[Gemini] valorMercado raw:', raw, '\u2192 parsed:', valor);
    if (!valor || isNaN(valor) || valor < 1000) throw new Error(`valorMercado inv\u00e1lido: ${raw}`);

    return {
      valorMercado: Math.round(valor),
      observacao: resultado.observacao ?? '',
      fonte: 'Gemini 2.5 Flash + Google Search',
    };

  } catch (err) {
    if ((err as { isRateLimit?: boolean }).isRateLimit) throw err;
    console.error('[Gemini] Erro:', err instanceof Error ? err.message : String(err));
    return null;
  }
};
