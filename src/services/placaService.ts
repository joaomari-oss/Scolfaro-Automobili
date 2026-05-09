/**
 * placaService.ts
 * Auto-preenche dados do veículo via Gemini Search Grounding consultando a placa.
 * Usa VITE_GEMINI_API_KEY.
 */

interface DadosPlaca {
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  combustivel?: string;
  motor?: string;
}

export async function buscarDadosPorPlaca(placa: string): Promise<DadosPlaca | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const placaFormatada = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (placaFormatada.length < 7) return null;

  const prompt = `Para o veículo brasileiro com placa ${placaFormatada}, retorne APENAS um JSON válido com os campos:
{"marca":"...","modelo":"...","ano":AAAA,"cor":"...","combustivel":"...","motor":"..."}
Se não souber algum campo, omita-o. Responda SOMENTE o JSON, sem explicações.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extrai o JSON da resposta
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as DadosPlaca;
    return parsed;
  } catch {
    return null;
  }
}
