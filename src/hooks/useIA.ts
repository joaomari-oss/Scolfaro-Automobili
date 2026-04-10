// src/hooks/useIA.ts
// Chama o backend (Render) para obter valores via IA.
// As chaves de API ficam no servidor — nunca no bundle do frontend.

import type { Veiculo } from '../types/veiculo';

// Em dev o proxy do Vite redireciona /api → localhost:3001.
// Em produção VITE_API_URL deve apontar para o backend no Render.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

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

  try {
    const res = await fetch(`${API_BASE}/api/ia/buscar-valores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marca:         veiculo.marca,
        modelo:        veiculo.modelo,
        ano:           veiculo.ano,
        quilometragem: veiculo.quilometragem,
        combustivel:   veiculo.combustivel,
      }),
    });

    if (!res.ok) throw new Error(`Backend retornou ${res.status}`);

    const data = await res.json() as {
      valorMercado: number;
      valorFipe: number;
      observacao: string;
      iaUsada?: 'gemini' | 'groq' | 'local';
    };

    console.info(`[IA] ✓ Valores recebidos do backend (fonte: ${data.iaUsada ?? 'desconhecida'})`);

    return {
      valorFipe:    data.valorFipe,
      valorMercado: data.valorMercado,
      iaUsada:      data.iaUsada === 'local' ? undefined : data.iaUsada,
      erros:        [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[IA] Backend indisponível, usando estimativa local:', msg);

    const estimativa = estimarLocalmente(veiculo);
    return {
      valorFipe:    estimativa.valorFipe,
      valorMercado: estimativa.valorMercado,
      iaUsada:      undefined,
      erros:        [`Backend indisponível — valores estimados localmente`],
    };
  }
};
