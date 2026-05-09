# PROMPT D — Integrações & IA
## Features: D1 Auto-fill por Placa | D2 Análise de Foto com IA | D3 Chat com a Coleção | D4 Scraping de Anúncios Similares

---

## CONTEXTO COMPLETO DO PROJETO

**Scolfaro Automobili** — dashboard premium de acervo de veículos familiar. Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Lucide React + Recharts.

### APIs de IA disponíveis (chaves em variáveis de ambiente)

#### Gemini 2.5 Flash — Primário (melhor qualidade + Google Search)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${VITE_GEMINI_API_KEY}`
- **Chave:** `import.meta.env.VITE_GEMINI_API_KEY`
- **Google Search Grounding:** adicionar `"tools": [{"googleSearch": {}}]` no body
- **Análise de imagem:** suporta base64 em `inlineData.mimeType` + `inlineData.data`
- **Free tier:** tokens ilimitados, 500 req/dia com Search Grounding
- **Modelo:** sempre `gemini-2.5-flash` (não usar versões depreciadas)

#### Groq — Fallback (velocidade, sem Search)
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Header:** `Authorization: Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
- **Modelo:** `llama-3.3-70b-versatile`
- **Chave:** `import.meta.env.VITE_GROQ_API_KEY`

#### FIPE — Sem API key (completamente gratuita e oficial)
- **Base URL:** `https://parallelum.com.br/fipe/api/v2`
- `GET /cars/brands` → lista marcas
- `GET /cars/brands/{brandCode}/models` → modelos da marca
- `GET /cars/brands/{brandCode}/models/{modelCode}/years` → anos disponíveis
- `GET /cars/brands/{brandCode}/models/{modelCode}/years/{yearCode}` → preço FIPE
- Suporta `/motorcycles/` e `/trucks/` além de `/cars/`

### Padrão de chamada ao Gemini
```typescript
async function chamarGemini(
  prompt: string,
  apiKey: string,
  usarSearch = false,
  imagemBase64?: { data: string; mimeType: string }
): Promise<string> {
  const parts: any[] = [{ text: prompt }];
  if (imagemBase64) {
    parts.unshift({ inlineData: imagemBase64 }); // imagem antes do texto
  }
  const body: any = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };
  if (usarSearch) {
    body.tools = [{ googleSearch: {} }];
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
```

### Padrão de chamada ao Groq
```typescript
async function chamarGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
```

### Variáveis de Ambiente
```typescript
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const groqKey   = import.meta.env.VITE_GROQ_API_KEY   as string;
// NÃO usar process.env, NÃO hardcodar, NÃO expor no console
```

### Tipos existentes
```typescript
interface Veiculo {
  id: string; modelo: string; marca: string; ano: number; placa: string;
  quilometragem: number; tipo: TipoVeiculo; cor: string; combustivel: string;
  cambio: string; valorMercado: number; valorFipe: number; fotos: string[];
  fichatecnica: FichaTecnica; gastos: Gasto[]; historicovalorizacao: HistoricoValor[];
  notas?: string; favorito: boolean; ultimaAtualizacao: string;
}
```

### Classes CSS disponíveis
`.sa-card, .sa-btn-primary, .sa-btn-ghost, .sa-input, .sa-select, .sa-label, .sa-badge, .font-display, .font-data`

---

## FEATURE D1 — Auto-fill por Placa

### O que é
Campo de placa no `AddVeiculoForm.tsx` que, ao digitar uma placa válida (7 caracteres), dispara busca automática via Gemini com Google Search e tenta preencher automaticamente: marca, modelo, ano, cor, tipo de motor, tipo de combustível.

### Por que Gemini e não uma API de placa
APIs de consulta de placa no Brasil geralmente requerem DETRAN authorization ou são pagas (Apikey de terceiros). O Gemini com Google Search consegue encontrar informações públicas de placas brasileiras de forma confiável e gratuita.

### Implementação

**1. Criar `src/services/placaService.ts`**
```typescript
export interface DadosPlaca {
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  combustivel?: string;
  tipo?: string;
  motor?: string;
  potencia?: string;
}

export async function buscarDadosPorPlaca(
  placa: string,
  geminiKey: string
): Promise<DadosPlaca | null> {
  if (!geminiKey) return null;
  const placaLimpa = placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
  if (placaLimpa.length < 7) return null;

  const prompt = `
Pesquise no Google informações sobre o veículo com placa brasileira ${placaLimpa}.
Retorne APENAS um JSON válido sem markdown com estes campos (deixe null se não encontrar):
{"marca":null,"modelo":null,"ano":null,"cor":null,"combustivel":null,"tipo":null,"motor":null,"potencia":null}
tipo deve ser um de: sedan, suv, esportivo, picape, hatch, conversivel, moto, van, utilitario, classico
combustivel deve ser um de: Gasolina, Etanol, Flex, Diesel, Elétrico, Híbrido
Retorne SOMENTE o JSON, nada mais.
`.trim();

  try {
    // Chamar Gemini com Search Grounding
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 256 },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    // Extrair JSON do texto (pode ter texto ao redor)
    const match = texto.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as DadosPlaca;
    return parsed;
  } catch {
    return null;
  }
}
```

**2. Modificar `src/components/Forms/AddVeiculoForm.tsx`**

No campo de placa, adicionar botão "Buscar dados" e lógica de auto-fill:
```tsx
const [buscandoPlaca, setBuscandoPlaca] = useState(false);

const handleBuscarPlaca = async () => {
  if (placa.length < 7) return;
  setBuscandoPlaca(true);
  try {
    const dados = await buscarDadosPorPlaca(placa, import.meta.env.VITE_GEMINI_API_KEY);
    if (dados) {
      if (dados.marca)      setMarca(dados.marca);
      if (dados.modelo)     setModelo(dados.modelo);
      if (dados.ano)        setAno(dados.ano);
      if (dados.cor)        setCor(dados.cor);
      if (dados.combustivel) setCombustivel(dados.combustivel);
      if (dados.tipo)       setTipo(dados.tipo as TipoVeiculo);
      if (dados.motor)      setMotor(dados.motor);
      if (dados.potencia)   setPotencia(dados.potencia);
      showToast('success', 'Dados encontrados pela placa!');
    } else {
      showToast('error', 'Não foi possível encontrar dados para esta placa.');
    }
  } finally {
    setBuscandoPlaca(false);
  }
};
```

No JSX do campo de placa:
```tsx
<div className="flex gap-2">
  <input className="sa-input flex-1" value={placa} onChange={e => handlePlaca(e.target.value)} maxLength={8} />
  <button
    type="button"
    className="sa-btn-ghost flex items-center gap-2 whitespace-nowrap"
    onClick={handleBuscarPlaca}
    disabled={placa.length < 7 || buscandoPlaca}
  >
    {buscandoPlaca
      ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      : <Search size={16} />}
    {buscandoPlaca ? 'Buscando...' : 'Buscar dados'}
  </button>
</div>
```

---

## FEATURE D2 — Análise de Foto com IA

### O que é
Ao fazer upload de uma foto no formulário de adição, botão "Identificar com IA" envia a imagem para o Gemini Vision que retorna: marca, modelo, ano estimado, cor, tipo de carroceria. Preenche os campos automaticamente.

### Implementação

**1. Criar `src/services/fotoAnaliseService.ts`**
```typescript
export interface AnaliseVeiculo {
  marca?: string;
  modelo?: string;
  anoEstimado?: number;
  cor?: string;
  tipo?: string;
  confianca: 'alta' | 'media' | 'baixa';
  observacao?: string;
}

export async function analisarFotoVeiculo(
  fotoBase64: string, // data URL (com ou sem prefixo "data:image/...")
  geminiKey: string
): Promise<AnaliseVeiculo | null> {
  if (!geminiKey) return null;

  // Extrair mimeType e base64 puro
  const match = fotoBase64.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match?.[1] ?? 'image/jpeg';
  const base64Data = match?.[2] ?? fotoBase64;

  const prompt = `
Analise esta foto de veículo e identifique:
Retorne APENAS JSON válido sem markdown:
{
  "marca": "nome da fabricante",
  "modelo": "nome do modelo",
  "anoEstimado": 2020,
  "cor": "cor predominante em português",
  "tipo": "sedan|suv|esportivo|picape|hatch|conversivel|moto|van|utilitario|classico",
  "confianca": "alta|media|baixa",
  "observacao": "detalhes extras se houver"
}
Se não conseguir identificar, retorne {"confianca":"baixa"} com os campos que conseguir.
`.trim();

  try {
    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as AnaliseVeiculo;
  } catch {
    return null;
  }
}
```

**2. Modificar `src/components/Forms/AddVeiculoForm.tsx`**

Após upload da primeira foto, mostrar botão:
```tsx
const [analisandoFoto, setAnalisandoFoto] = useState(false);

const handleAnalisarFoto = async () => {
  if (!fotos[0]) return;
  setAnalisandoFoto(true);
  try {
    const analise = await analisarFotoVeiculo(fotos[0], import.meta.env.VITE_GEMINI_API_KEY);
    if (analise) {
      if (analise.marca)        setMarca(prev => prev || analise.marca!);
      if (analise.modelo)       setModelo(prev => prev || analise.modelo!);
      if (analise.anoEstimado)  setAno(prev => prev || analise.anoEstimado!);
      if (analise.cor)          setCor(prev => prev || analise.cor!);
      if (analise.tipo)         setTipo(prev => prev || analise.tipo as TipoVeiculo);
      const msg = analise.confianca === 'alta'
        ? 'Veículo identificado com alta confiança!'
        : analise.confianca === 'media'
        ? 'Veículo identificado. Verifique os dados.'
        : 'Identificação parcial. Preencha os campos restantes.';
      showToast(analise.confianca === 'baixa' ? 'warning' : 'success', msg);
    }
  } finally {
    setAnalisandoFoto(false);
  }
};
```

Mostrar botão logo após o upload da primeira foto:
```tsx
{fotos.length > 0 && (
  <button type="button" className="sa-btn-ghost flex items-center gap-2 text-sm" onClick={handleAnalisarFoto} disabled={analisandoFoto}>
    <Sparkles size={14} />
    {analisandoFoto ? 'Identificando...' : 'Identificar veículo pela foto'}
  </button>
)}
```

---

## FEATURE D3 — Chat com a Coleção

### O que é
Um painel de chat flutuante (botão no canto inferior direito) onde o usuário faz perguntas sobre sua coleção em linguagem natural e a IA responde com base nos dados reais. Ex: "Qual meu carro mais barato de manter?", "Quais carros valorizam mais?", "Qual o total que gastei com manutenção?"

### Implementação

**1. Criar `src/components/Layout/ChatColeção.tsx`**

```typescript
interface Mensagem {
  id: string;
  tipo: 'usuario' | 'ia';
  texto: string;
  timestamp: Date;
}
```

Construir contexto da coleção para o Gemini:
```typescript
function montarContextoColeção(veiculos: Veiculo[]): string {
  const totalValorMercado = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const totalGastos = veiculos.reduce((s, v) => s + v.gastos.reduce((gs, g) => gs + g.valor, 0), 0);
  
  const resumo = veiculos.map(v => {
    const gastoTotal = v.gastos.reduce((s, g) => s + g.valor, 0);
    const gastoManutencao = v.gastos.filter(g => g.tipo === 'manutencao').reduce((s, g) => s + g.valor, 0);
    return `- ${v.marca} ${v.modelo} ${v.ano}: Valor Mercado R$${v.valorMercado.toLocaleString('pt-BR')}, FIPE R$${v.valorFipe.toLocaleString('pt-BR')}, ${v.quilometragem.toLocaleString('pt-BR')}km, Gastos Total R$${gastoTotal.toLocaleString('pt-BR')} (Manutenção: R$${gastoManutencao.toLocaleString('pt-BR')})`;
  }).join('\n');

  return `
Você é um assistente especializado em análise de acervo de veículos premium para a família Scolfaro.
Responda SEMPRE em português brasileiro, de forma concisa e clara.
Use formatação markdown quando adequado (negrito, listas).
NÃO invente dados — baseie-se apenas nos dados abaixo.

RESUMO DA COLEÇÃO:
- Total de veículos: ${veiculos.length}
- Valor total de mercado: R$${totalValorMercado.toLocaleString('pt-BR')}
- Total gasto: R$${totalGastos.toLocaleString('pt-BR')}

VEÍCULOS:
${resumo}
  `.trim();
}
```

Chamar Gemini com contexto:
```typescript
const enviarMensagem = async (texto: string) => {
  const novaMensagem: Mensagem = { id: crypto.randomUUID(), tipo: 'usuario', texto, timestamp: new Date() };
  setMensagens(prev => [...prev, novaMensagem]);
  setCarregando(true);
  
  try {
    const contexto = montarContextoColeção(veiculos);
    const body = {
      contents: [
        { role: 'user', parts: [{ text: contexto }] },
        ...mensagens.map(m => ({
          role: m.tipo === 'usuario' ? 'user' : 'model',
          parts: [{ text: m.texto }],
        })),
        { role: 'user', parts: [{ text: texto }] },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não consegui processar sua pergunta.';
    setMensagens(prev => [...prev, { id: crypto.randomUUID(), tipo: 'ia', texto: resposta, timestamp: new Date() }]);
  } catch {
    setMensagens(prev => [...prev, { id: crypto.randomUUID(), tipo: 'ia', texto: 'Erro ao conectar com a IA. Verifique sua chave Gemini.', timestamp: new Date() }]);
  } finally {
    setCarregando(false);
  }
};
```

Layout do chat:
- Botão flutuante canto inferior direito: `fixed bottom-6 right-6 z-40` com ícone `MessageSquare`
- Painel 380x500px: `fixed bottom-20 right-6 z-40 w-[380px] h-[500px]`
- Header do chat com título "Assistente Scolfaro" e botão fechar
- Lista de mensagens com scroll automático no final
- Input na base com botão enviar
- Sugestões rápidas clicáveis: "Qual meu carro mais valioso?", "Total gasto em manutenção", "Quais carros valorizam mais?"

**2. Adicionar no `App.tsx`**
```tsx
import ChatColecao from './components/Layout/ChatColecao';
// No JSX, dentro do BrowserRouter, após o Header:
<ChatColecao veiculos={veiculos} />
```

---

## FEATURE D4 — Anúncios Similares (Referência de Mercado)

### O que é
Dentro do `VeiculoModal.tsx`, seção "Referências de Mercado" que usa o Gemini com Google Search para encontrar e listar os 5 anúncios similares mais recentes (mesmo modelo, ano próximo, km similar) com preço, estado de conservação e link. Permite confirmar se o valor de mercado está correto.

### Implementação

**1. Criar `src/services/anunciosService.ts`**
```typescript
export interface AnuncioSimilar {
  titulo: string;
  preco: number;
  km: number;
  ano: number;
  localizacao: string;
  plataforma: string; // 'Webmotors' | 'OLX' | 'iCarros' | etc.
  url?: string;
  observacao?: string;
}

export async function buscarAnunciosSimilares(
  veiculo: { marca: string; modelo: string; ano: number; quilometragem: number; combustivel: string },
  geminiKey: string
): Promise<AnuncioSimilar[]> {
  if (!geminiKey) return [];

  const prompt = `
Pesquise no Google anúncios de venda do ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano} no Brasil.
Busque em: Webmotors, OLX Autos, iCarros, Mercado Livre Veículos.
Foco em veículos com quilometragem similar a ${veiculo.quilometragem.toLocaleString('pt-BR')} km (±30.000 km).
Combustível: ${veiculo.combustivel}.

Retorne APENAS JSON válido (array) com até 5 anúncios reais encontrados:
[{"titulo":"...","preco":000000,"km":00000,"ano":0000,"localizacao":"Cidade-UF","plataforma":"Webmotors","url":"https://...","observacao":"estado geral"}]
preco deve ser número inteiro em reais.
Se não encontrar anúncios reais, retorne [].
Retorne APENAS o JSON, sem markdown.
`.trim();

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 1024 },
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = texto.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as AnuncioSimilar[];
  } catch {
    return [];
  }
}
```

**2. Criar `src/components/Cards/AnunciosSimilaresCard.tsx`**

Exibir como tabela compacta ou lista de cards:
- Coluna: Plataforma (badge) | Título | Ano | KM | Preço | Localização
- Destacar o preço mais próximo ao valor de mercado atual
- Calcular e mostrar: "Média dos anúncios: R$ XXX.XXX" vs "Valor atual cadastrado: R$ XXX.XXX"
- Badge: "Acima do mercado" ou "Abaixo do mercado" ou "Alinhado ao mercado"
- Botão "Atualizar busca" (novo fetch)
- Loading state enquanto busca

**3. Adicionar aba "Referências" no `VeiculoModal.tsx`**
- Busca lazy: só dispara quando o usuário clica na aba "Referências" (não no carregamento do modal)
- Cache de 1 hora no state local (não rebuscar se já buscou recentemente)

---

## INSTRUÇÕES GERAIS PARA TODAS AS FEATURES

1. **API Keys:** SEMPRE usar `import.meta.env.VITE_GEMINI_API_KEY` e `import.meta.env.VITE_GROQ_API_KEY`. Nunca hardcodar, nunca logar no console.
2. **Cascata IA:** Gemini → Groq → fallback gracioso (null ou dado padrão)
3. **Error handling:** Todo fetch deve ter try/catch. Falha silenciosa (return null) em vez de crash.
4. **Rate limiting:** Gemini free: 500 req/dia com Search. Groq: 14.400 req/dia. Não disparar múltiplas chamadas simultâneas.
5. **JSON parsing seguro:** Sempre usar `.match(/\{[\s\S]*\}/)` ou `.match(/\[[\s\S]*\]/)` para extrair JSON de resposta de texto.
6. **Loading states:** Sempre mostrar spinner durante chamadas de IA (podem demorar 2-5 segundos).
7. **Gemini com imagem:** A imagem base64 vai ANTES do texto nos `parts[]` — ordem importa.
8. **FIPE:** `parallelum.com.br/fipe/api/v2` é completamente gratuita e sem autenticação. Usar sempre para valor FIPE oficial.
9. **Temperatura:** Use `temperature: 0.0` para extração de dados estruturados, `temperature: 0.3` para texto conversacional.
10. **Validação:** Sempre validar campos obrigatórios do JSON retornado antes de usar (pode ter campos null).
