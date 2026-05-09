/**
 * anunciosService.ts
 * Busca anúncios similares no mercado via Gemini Search Grounding.
 */

export interface AnuncioSimilar {
  titulo: string;
  preco: number;
  km?: string;
  ano?: number;
  fonte: string;
  url?: string;
}

export async function buscarAnunciosSimilares(
  marca: string,
  modelo: string,
  ano: number,
  valorMercado: number
): Promise<AnuncioSimilar[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return [];

  const prompt = `Busque anúncios reais de veículos similares ao ${marca} ${modelo} ${ano} no mercado brasileiro.
Valor de referência: R$ ${valorMercado.toLocaleString('pt-BR')}.
Retorne APENAS um JSON array com até 5 resultados reais:
[{"titulo":"...","preco":NUMERO,"km":"...","ano":AAAA,"fonte":"OLX|WebMotors|ICarros|MercadoLivre","url":"..."}]
Responda SOMENTE o JSON array.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as AnuncioSimilar[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}
