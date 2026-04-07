import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = process.env.PORT ?? 3001;
const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

if (!hasAnthropicKey) {
  console.warn('⚠️ ANTHROPIC_API_KEY não definida. API iniciará em modo de estimativa local.');
}

const anthropic = hasAnthropicKey
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
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

  // Faixa de quilometragem para contextualizar depreciação
  const kmFaixa =
    quilometragem < 30_000 ? 'baixa (< 30 mil km)' :
    quilometragem < 80_000 ? 'média (30–80 mil km)' :
    quilometragem < 150_000 ? 'alta (80–150 mil km)' :
    'muito alta (> 150 mil km)';

  if (!anthropic) {
    res.json(estimarValoresLocalmente({ modelo, marca, ano, quilometragem, combustivel }));
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      temperature: 0,  // 0 = máxima precisão/determinismo
      system: `Você é um perito em avaliação de veículos no mercado brasileiro com profundo conhecimento da Tabela FIPE e do mercado de seminovos e usados.

REGRAS:
- Retorne APENAS o objeto JSON, sem markdown, sem blocos de código, sem texto antes ou depois
- valorFipe: valor da Tabela FIPE oficial para o veículo no mês de referência (número inteiro em reais)
- valorMercado: preço médio real de venda no mercado brasileiro (anúncios OLX/Webmotors/iCarros) para o estado de conservação e km indicados (número inteiro em reais)
- observacao: string de até 120 caracteres mencionando 1–2 fatores práticos que afetam o preço desse veículo
- Nunca retorne 0, null, undefined ou valores abaixo de R$5.000 ou acima de R$50.000.000`,
      messages: [
        {
          role: 'user',
          content: `Veículo: ${marca} ${modelo} ${ano}
Combustível: ${combustivel}
Quilometragem: ${quilometragem.toLocaleString('pt-BR')} km (${kmFaixa})
Referência: ${mesAno}

Retorne exatamente neste formato:
{"valorMercado":0,"valorFipe":0,"observacao":""}`,
        },
      ],
    });

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Resposta sem JSON válido: ${rawText.slice(0, 80)}`);
    }

    const parsed = JSON.parse(jsonMatch[0]) as IAValores;

    // Validação de sanidade
    if (
      typeof parsed.valorMercado !== 'number' ||
      typeof parsed.valorFipe !== 'number' ||
      parsed.valorMercado < 5_000 ||
      parsed.valorFipe < 5_000 ||
      parsed.valorMercado > 50_000_000 ||
      parsed.valorFipe > 50_000_000
    ) {
      throw new Error(
        `Valores fora do intervalo esperado: mercado=${parsed.valorMercado}, fipe=${parsed.valorFipe}`
      );
    }

    res.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[IA] buscar-valores erro:', msg);
    res.status(500).json({ error: msg });
  }
});

// ─── Healthcheck ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── FIPE API ─────────────────────────────────────────────────────────────────
const FIPE_BASE = 'https://parallelum.com.br/fipe/api/v1';

interface FipeMarca  { codigo: string; nome: string }
interface FipeModelo { codigo: string; nome: string }
interface FipeAno    { codigo: string; nome: string }

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (process.env.FIPE_API_TOKEN) headers['X-Subscription-Token'] = process.env.FIPE_API_TOKEN;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`FIPE API error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

interface FipeSearchResult {
  found: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

async function searchFipeByVehicle(marca: string, modelo: string, ano: number): Promise<FipeSearchResult> {
  try {
    const marcas = await fetchJson<FipeMarca[]>(`${FIPE_BASE}/carros/marcas`);

    const marcaNorm = normStr(marca);
    const foundBrand = marcas.find(b =>
      normStr(b.nome).includes(marcaNorm) || marcaNorm.includes(normStr(b.nome))
    );
    if (!foundBrand) return { found: false, data: null, error: `Marca "${marca}" não encontrada na tabela FIPE` };

    const modelosData = await fetchJson<{ modelos: FipeModelo[] }>(`${FIPE_BASE}/carros/marcas/${foundBrand.codigo}/modelos`);
    const modelos = modelosData.modelos ?? [];

    const modeloNorm = normStr(modelo);
    const firstWord  = modeloNorm.split(' ')[0];

    let foundModel = modelos.find(m => normStr(m.nome) === modeloNorm);
    if (!foundModel) foundModel = modelos.find(m => normStr(m.nome).includes(firstWord));
    if (!foundModel) foundModel = modelos.find(m => firstWord.includes(normStr(m.nome).split(' ')[0]));
    if (!foundModel) return { found: false, data: null, error: `Modelo "${modelo}" não encontrado para a marca "${marca}"` };

    const anos = await fetchJson<FipeAno[]>(`${FIPE_BASE}/carros/marcas/${foundBrand.codigo}/modelos/${foundModel.codigo}/anos`);
    if (!anos.length) return { found: false, data: null, error: 'Nenhum ano encontrado para este modelo' };

    const sorted = [...anos].sort((a, b) => {
      const ya = parseInt(a.nome);
      const yb = parseInt(b.nome);
      return Math.abs(ya - ano) - Math.abs(yb - ano);
    });

    const fipeData = await fetchJson<Record<string, unknown>>(
      `${FIPE_BASE}/carros/marcas/${foundBrand.codigo}/modelos/${foundModel.codigo}/anos/${sorted[0].codigo}`
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
