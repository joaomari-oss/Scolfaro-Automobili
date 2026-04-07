import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = process.env.PORT ?? 3001;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY não definida no .env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

app.listen(PORT, () => {
  console.log(`✅ Scolfaro API rodando em http://localhost:${PORT}`);
});
