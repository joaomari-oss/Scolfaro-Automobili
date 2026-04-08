import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Clientes de IA ───────────────────────────────────────────────────────────
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const hasGroqKey   = Boolean(process.env.GROQ_API_KEY);

if (!hasGeminiKey && !hasGroqKey) {
  console.warn('⚠️ Nenhuma chave de IA definida. API iniciará em modo de estimativa local.');
} else {
  if (hasGeminiKey)  console.info('✅ Gemini configurado (primário)');
  if (hasGroqKey)    console.info('✅ Groq configurado (fallback)');
}

const gemini = hasGeminiKey
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  : null;

const groqClient = hasGroqKey
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const fallbackBaseByMarca: Record<string, number> = {
  ferrari: 2_100_000,
  lamborghini: 2_600_000,
  porsche: 950_000,
  mclaren: 2_300_000,
  maserati: 780_000,
  'land rover': 650_000,
  'range rover': 900_000,
  mercedes: 380_000,
  bmw: 320_000,
  audi: 290_000,
  volvo: 260_000,
  toyota: 180_000,
  honda: 160_000,
  jeep: 210_000,
  volkswagen: 135_000,
  chevrolet: 125_000,
  fiat: 95_000,
};

function estimarValoresLocalmente(params: BuscarValoresBody): IAValores {
  const { marca, modelo, ano, quilometragem, combustivel } = params;
  const anoAtual = new Date().getFullYear();
  const idade = Math.max(0, anoAtual - ano);
  const km = Number.isFinite(quilometragem) ? quilometragem : 0;
  const marcaNormalizada = marca.toLowerCase();

  const baseMarca =
    Object.entries(fallbackBaseByMarca).find(([key]) => marcaNormalizada.includes(key))?.[1] ?? 120_000;

  const depreciacaoAno = Math.max(0.4, 1 - idade * 0.05);
  const ajusteKm = km < 30_000 ? 1.05 : km < 80_000 ? 1 : km < 150_000 ? 0.93 : 0.85;
  const ajusteCombustivel = combustivel.toLowerCase().includes('diesel') ? 1.03 : 1;

  const valorFipe = Math.min(50_000_000, Math.max(5_000, Math.round(baseMarca * depreciacaoAno)));
  const valorMercado = Math.min(
    50_000_000,
    Math.max(5_000, Math.round(valorFipe * ajusteKm * ajusteCombustivel * 1.04))
  );

  return {
    valorMercado,
    valorFipe,
    observacao: `Estimativa local de ${marca} ${modelo} baseada em ano e quilometragem.`,
  };
}

// CORS: aceita apenas o frontend local (dev e preview)
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// Rate limit: máximo 30 req/min por IP
const limiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use('/api', limiter);

// ─── ROTA: Buscar valores de mercado e FIPE ───────────────────────────────────
interface BuscarValoresBody {
  modelo: string;
  marca: string;
  ano: number;
  quilometragem: number;
  combustivel: string;
}

interface IAValores {
  valorMercado: number;
  valorFipe: number;
  observacao: string;
}

app.post('/api/ia/buscar-valores', async (req: Request, res: Response) => {
  const { modelo, marca, ano, quilometragem, combustivel } =
    req.body as BuscarValoresBody;

  if (!modelo || !marca || !ano) {
    res.status(400).json({ error: 'modelo, marca e ano são obrigatórios' });
    return;
  }

  const mesAno = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const kmFaixa =
    quilometragem < 30_000 ? 'baixa (< 30 mil km)' :
    quilometragem < 80_000 ? 'média (30–80 mil km)' :
    quilometragem < 150_000 ? 'alta (80–150 mil km)' :
    'muito alta (> 150 mil km)';

  // Prompt compartilhado entre Gemini e Groq
  const systemPrompt = `Você é um perito em avaliação de veículos no mercado brasileiro com profundo conhecimento da Tabela FIPE e do mercado de seminovos e usados.

REGRAS:
- Retorne APENAS o objeto JSON, sem markdown, sem blocos de código, sem texto antes ou depois
- valorFipe: valor da Tabela FIPE oficial para o veículo no mês de referência (número inteiro em reais)
- valorMercado: preço médio real de venda no mercado brasileiro (anúncios OLX/Webmotors/iCarros) para o estado de conservação e km indicados (número inteiro em reais)
- observacao: string de até 120 caracteres mencionando 1–2 fatores práticos que afetam o preço desse veículo
- Nunca retorne 0, null, undefined ou valores abaixo de R$5.000 ou acima de R$50.000.000`;

  const userPrompt = `Veículo: ${marca} ${modelo} ${ano}
Combustível: ${combustivel}
Quilometragem: ${quilometragem.toLocaleString('pt-BR')} km (${kmFaixa})
Referência: ${mesAno}

Retorne exatamente neste formato:
{"valorMercado":0,"valorFipe":0,"observacao":""}`;

  function parseAndValidate(raw: string): IAValores {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Resposta sem JSON válido: ${raw.slice(0, 80)}`);
    const parsed = JSON.parse(jsonMatch[0]) as IAValores;
    if (
      typeof parsed.valorMercado !== 'number' ||
      typeof parsed.valorFipe !== 'number' ||
      parsed.valorMercado < 5_000 ||
      parsed.valorFipe < 5_000 ||
      parsed.valorMercado > 50_000_000 ||
      parsed.valorFipe > 50_000_000
    ) {
      throw new Error(`Valores fora do intervalo esperado: mercado=${parsed.valorMercado}, fipe=${parsed.valorFipe}`);
    }
    return parsed;
  }

  // ── 1. Tentar Gemini (primário) ─────────────────────────────────────────────
  if (gemini) {
    try {
      const geminiModel = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await geminiModel.generateContent({
        generationConfig: { maxOutputTokens: 2048, temperature: 0, responseMimeType: 'application/json' },
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      });
      const parsed = parseAndValidate(result.response.text().trim());
      console.info('[IA] Respondido por Gemini');
      res.json(parsed);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[IA] Gemini falhou (${msg.slice(0, 80)}) — tentando Groq...`);
    }
  }

  // ── 2. Tentar Groq (fallback) ───────────────────────────────────────────────
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: 512,
        temperature: 0,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content ?? '';
      const parsed = parseAndValidate(raw);
      console.info('[IA] Respondido por Groq');
      res.json(parsed);
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[IA] Groq falhou (${msg.slice(0, 80)}) — usando estimativa local`);
    }
  }

  // ── 3. Fallback local ───────────────────────────────────────────────────────
  console.warn('[IA] Todas as IAs indisponíveis — usando estimativa local');
  res.json(estimarValoresLocalmente({ modelo, marca, ano, quilometragem, combustivel }));
});

// ─── Healthcheck ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── FIPE API v2 ──────────────────────────────────────────────────────────────
// Docs: https://deividfortuna.github.io/fipe/v2/
// Token gratuito (1000 req/dia): https://fipe.online/register
const FIPE_BASE = 'https://fipe.parallelum.com.br/api/v2';

interface FipeBrand  { code: string; name: string }
interface FipeModel  { code: string; name: string }
interface FipeYear   { code: string; name: string }

interface FipeVehicleInfo {
  brand: string;
  codeFipe: string;
  fuel: string;
  fuelAcronym: string;
  model: string;
  modelYear: number;
  price: string;
  referenceMonth: string;
  vehicleType: number;
  priceHistory?: { month: string; price: string }[];
}

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  if (process.env.FIPE_API_TOKEN) headers['X-Subscription-Token'] = process.env.FIPE_API_TOKEN;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`FIPE API error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

interface FipeSearchResult {
  found: boolean;
  data: FipeVehicleInfo | null;
  error?: string;
}

async function searchFipeByVehicle(marca: string, modelo: string, ano: number): Promise<FipeSearchResult> {
  try {
    const brands = await fetchJson<FipeBrand[]>(`${FIPE_BASE}/cars/brands`);

    const marcaNorm = normStr(marca);
    const foundBrand = brands.find(b =>
      normStr(b.name).includes(marcaNorm) || marcaNorm.includes(normStr(b.name))
    );
    if (!foundBrand) return { found: false, data: null, error: `Marca "${marca}" não encontrada na tabela FIPE` };

    const models = await fetchJson<FipeModel[]>(`${FIPE_BASE}/cars/brands/${foundBrand.code}/models`);

    const modeloNorm = normStr(modelo);
    const firstWord  = modeloNorm.split(' ')[0];

    // Candidatos por similaridade de nome (ordem de preferência)
    const exactMatch    = models.filter(m => normStr(m.name) === modeloNorm);
    const includesAll   = models.filter(m => normStr(m.name).includes(modeloNorm));
    const includesFirst = models.filter(m => normStr(m.name).includes(firstWord));
    const candidates = exactMatch.length
      ? exactMatch
      : includesAll.length
        ? includesAll
        : includesFirst;

    if (!candidates.length) return { found: false, data: null, error: `Modelo "${modelo}" não encontrado para a marca "${marca}"` };

    // Entre os candidatos, prefere o que tem o ano solicitado na tabela FIPE
    let foundModel: FipeModel | undefined;
    for (const candidate of candidates) {
      const candidateYears = await fetchJson<FipeYear[]>(
        `${FIPE_BASE}/cars/brands/${foundBrand.code}/models/${candidate.code}/years`
      );
      const hasYear = candidateYears.some(y => parseInt(y.name) === ano);
      if (hasYear) { foundModel = candidate; break; }
    }
    // Se nenhum candidato tiver o ano exato, usa o primeiro candidato
    if (!foundModel) foundModel = candidates[0];

    const years = await fetchJson<FipeYear[]>(`${FIPE_BASE}/cars/brands/${foundBrand.code}/models/${foundModel.code}/years`);
    if (!years.length) return { found: false, data: null, error: 'Nenhum ano encontrado para este modelo' };

    const sorted = [...years].sort((a, b) => {
      const ya = parseInt(a.name);
      const yb = parseInt(b.name);
      return Math.abs(ya - ano) - Math.abs(yb - ano);
    });

    const fipeData = await fetchJson<FipeVehicleInfo>(
      `${FIPE_BASE}/cars/brands/${foundBrand.code}/models/${foundModel.code}/years/${sorted[0].code}`
    );

    return { found: true, data: fipeData };
  } catch (err) {
    return { found: false, data: null, error: `Erro ao consultar FIPE: ${String(err)}` };
  }
}

// POST /api/fipe/search — body: { marca, modelo, ano }
app.post('/api/fipe/search', async (req: Request, res: Response) => {
  const { marca, modelo, ano } = req.body as { marca?: string; modelo?: string; ano?: number };
  if (!marca || !modelo || !ano) {
    res.status(400).json({ success: false, error: 'marca, modelo e ano são obrigatórios' });
    return;
  }
  try {
    const result = await searchFipeByVehicle(marca, modelo, Number(ano));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Scolfaro API rodando em http://localhost:${PORT}`);
});
