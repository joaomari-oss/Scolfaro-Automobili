/**
 * placaService.ts
 *
 * Consulta veículo por placa com cascata de estratégias:
 *
 * 1. WDAPI2 (DENATRAN/RENAVAM) — se VITE_WDAPI_TOKEN estiver configurado.
 *    Registro gratuito em: https://wdapi2.com.br
 *
 * 2. Gemini 2.5 Flash (inferência por dados de treinamento) — sempre funciona,
 *    retorna dados estimados com base no formato da placa e mercado brasileiro.
 *    NÃO usa Search Grounding (dados de placa não estão indexados na web pública).
 */

export interface DadosPlaca {
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  combustivel?: string;
  motor?: string;
  tipo?: string;
  /** true = inferido pela IA, false = confirmado pelo DENATRAN */
  estimado?: boolean;
}

// ─── Formato da placa ──────────────────────────────────────────────────────────

interface InfoPlaca {
  placaLimpa: string;
  mercosul: boolean;
  /** Para Mercosul, o 5º caractere (letra) codifica o ano de registro */
  anoEstimado?: number;
}

const LETRA_ANO_MERCOSUL: Record<string, number> = {
  A: 2018, B: 2019, C: 2020, D: 2021, E: 2022,
  F: 2023, G: 2024, H: 2025, I: 2026, J: 2027,
};

function analisarPlaca(placa: string): InfoPlaca {
  const placaLimpa = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Mercosul: ABC1D23 (3 letras + dígito + letra + 2 dígitos)
  const isMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(placaLimpa);
  const anoEstimado = isMercosul ? LETRA_ANO_MERCOSUL[placaLimpa[4]] : undefined;
  return { placaLimpa, mercosul: isMercosul, anoEstimado };
}

// ─── Estratégia 1: WDAPI2 (dados reais do DENATRAN) ──────────────────────────

async function tentarWDAPI2(placaLimpa: string): Promise<DadosPlaca | null> {
  const token = import.meta.env.VITE_WDAPI_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://wdapi2.com.br/consulta/${placaLimpa}/${token}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const d = await res.json();
    // Sinaliza token inválido ou placa não encontrada
    if (d?.ERRO || (typeof d?.message === 'string' && d.message.toLowerCase().includes('invalid'))) {
      return null;
    }

    const marca  = d.MARCA  ?? d.marca  ?? d.Marca;
    const modelo = d.MODELO ?? d.modelo ?? d.Modelo;
    if (!marca && !modelo) return null;

    return {
      marca,
      modelo,
      ano:        parseInt(d.ANO        ?? d.ano        ?? d.Ano)        || undefined,
      cor:        d.COR         ?? d.cor         ?? d.Cor,
      combustivel:d.COMBUSTIVEL ?? d.combustivel ?? d.Combustivel,
      motor:      d.MOTOR       ?? d.motor       ?? d.Motor,
      estimado: false,
    };
  } catch {
    return null;
  }
}

// ─── Estratégia 2: Gemini 2.5 Flash (inferência por treinamento) ──────────────

async function tentarGemini(info: InfoPlaca): Promise<DadosPlaca | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const { placaLimpa, mercosul, anoEstimado } = info;

  const hintFormato = mercosul
    ? `A placa está no formato Mercosul (ABC1D23). O 5º caractere indica registro${anoEstimado ? ` a partir de ${anoEstimado}` : ' após 2018'}.`
    : 'A placa está no formato antigo brasileiro (ABC1234), usada antes de 2018.';

  const prompt = `Você é especialista no mercado automotivo brasileiro. Analise a placa "${placaLimpa}".

${hintFormato}

Com base nos seus dados de treinamento sobre veículos vendidos no Brasil, infira os dados mais prováveis. Pense nos modelos mais comuns registrados com este formato de placa e neste período.

Retorne apenas os campos que você consegue inferir com alta confiança (omita campos incertos):
- marca: string (ex: "Toyota", "Volkswagen", "Fiat", "Hyundai")
- modelo: string (ex: "Corolla", "Gol", "Uno", "HB20")
- ano: number (ano de fabricação/modelo)
- cor: string (cor mais provável)
- combustivel: string — use exatamente um de: "Flex", "Gasolina", "Diesel", "Elétrico", "Híbrido"
- motor: string (ex: "1.0", "1.4", "2.0 Turbo")
- tipo: string — use exatamente um de: "sedan", "hatch", "suv", "esportivo", "picape", "van", "moto", "classico"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // responseMimeType força JSON puro — elimina markdown, explicações, etc.
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) return null;

    let parsed: DadosPlaca | null = null;

    // Tentativa 1: parse direto (responseMimeType garante JSON puro)
    try { parsed = JSON.parse(text.trim()); } catch { /* continua */ }

    // Tentativa 2: extrai bloco JSON se vier com markdown
    if (!parsed) {
      const m = text.match(/\{[\s\S]*?\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* skip */ } }
    }

    if (!parsed || (!parsed.marca && !parsed.modelo)) return null;

    return { ...parsed, estimado: true };
  } catch {
    return null;
  }
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export async function buscarDadosPorPlaca(placa: string): Promise<DadosPlaca | null> {
  const info = analisarPlaca(placa);
  if (info.placaLimpa.length < 7) return null;

  // Tenta WDAPI2 primeiro (dados reais); cai no Gemini se não disponível
  return (await tentarWDAPI2(info.placaLimpa)) ?? (await tentarGemini(info));
}
