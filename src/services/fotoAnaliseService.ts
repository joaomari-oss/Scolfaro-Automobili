/**
 * fotoAnaliseService.ts
 * Analisa uma foto de veículo via Gemini Vision e extrai dados.
 */

interface DadosFoto {
  marca?: string;
  modelo?: string;
  cor?: string;
  tipo?: string;
  ano?: number;
  observacoes?: string;
}

export async function analisarFotoVeiculo(base64: string): Promise<DadosFoto | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  // Remove o prefixo data URL se existir
  const imagemBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const mimeType = base64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

  const prompt = `Analise esta foto de veículo e retorne APENAS um JSON válido:
{"marca":"...","modelo":"...","cor":"...","tipo":"sedan|suv|esportivo|picape|hatch|conversivel|classico","ano":AAAA,"observacoes":"..."}
Se não tiver certeza de algum campo, omita-o. Responda SOMENTE o JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imagemBase64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as DadosFoto;
  } catch {
    return null;
  }
}
