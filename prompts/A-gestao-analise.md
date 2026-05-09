# PROMPT A — Gestão & Análise
## Features: A1 Comparador | A2 Depreciação | A3 ROI | A4 Timeline | A5 Alertas

---

## CONTEXTO COMPLETO DO PROJETO

Você está trabalhando no **Scolfaro Automobili** — um dashboard premium de gestão de acervo de veículos para uso familiar. É um painel de controle privado, estilo Bloomberg/Porsche Digital, não um site de vendas.

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **UI:** Lucide React (ícones), Recharts (gráficos), React Router v7
- **Banco:** Supabase (PostgreSQL) com fallback automático para localStorage
- **Fontes:** Syne (`.font-display`, títulos), DM Sans (corpo), JetBrains Mono (`.font-data`, números)
- **Tema:** `data-theme="dark"|"light"` no `<html>`. NUNCA use `.dark` do Tailwind.
- **Cores:** Sempre use CSS custom properties (`var(--text-primary)`, `var(--bg-card)`, `var(--accent-primary)`, etc.)
- **Accent:** Dark mode = amarelo `#F5C400`, Light mode = azul `#1D4ED8`

### Classes CSS já existentes (use sempre que possível)
```
.sa-card          → cards com borda e fundo
.sa-btn-primary   → botão primário (accent)
.sa-btn-ghost     → botão fantasma/secundário
.sa-input         → inputs de texto
.sa-select        → selects
.sa-chip          → chips/filtros
.sa-badge         → badges coloridos
.sa-table         → tabelas
.sa-label         → labels de formulário
.vehicle-card     → card de veículo
.empty-state      → estado vazio
.font-display     → fonte Syne
.font-data        → fonte JetBrains Mono (números/placas)
```

### Variáveis de Ambiente (NUNCA hardcode valores)
```
VITE_SUPABASE_URL        → URL do projeto Supabase
VITE_SUPABASE_ANON_KEY   → Chave anônima do Supabase
VITE_GEMINI_API_KEY      → Google Gemini 2.5 Flash (busca valor de mercado)
VITE_GROQ_API_KEY        → Groq fallback (llama-3.3-70b)
VITE_API_URL             → URL do backend no Render (pode estar vazio em dev)
```

### Fontes de Dados para Valores
- **Valor FIPE oficial:** API pública `https://parallelum.com.br/fipe/api/v2` — sem auth, sem API key
  - GET `/cars/brands` → GET `/cars/brands/{brandCode}/models` → GET `/cars/brands/{brandCode}/models/{modelCode}/years` → GET `/cars/brands/{brandCode}/models/{modelCode}/years/{yearCode}`
- **Valor de Mercado (melhor fonte):** Gemini 2.5 Flash com Google Search Grounding → busca preços reais em Webmotors, OLX Autos, iCarros em tempo real
  - Modelo: `gemini-2.5-flash`, endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${VITE_GEMINI_API_KEY}`
  - Habilitar: `tools: [{ googleSearch: {} }]`
- **Fallback mercado:** Groq `llama-3.3-70b-versatile` via `https://api.groq.com/openai/v1/chat/completions` com header `Authorization: Bearer ${VITE_GROQ_API_KEY}`

### Tipos TypeScript existentes (`src/types/veiculo.ts`)
```typescript
interface Veiculo {
  id: string;
  modelo: string;
  marca: string;
  ano: number;
  placa: string;
  quilometragem: number;
  tipo: TipoVeiculo; // 'sedan'|'suv'|'esportivo'|'picape'|'hatch'|'conversivel'|'moto'|'van'|'utilitario'|'classico'
  carroceria: string;
  valorMercado: number;
  valorFipe: number;
  codigoFipe?: string;
  fichatecnica: FichaTecnica;
  fotos: string[];
  favorito: boolean;
  historicovalorizacao: HistoricoValor[]; // { data: string; valorMercado: number; valorFipe: number; fonte: string; }
  ultimaAtualizacao: string;
  cor: string;
  combustivel: string;
  cambio: string;
  notas?: string;
  gastos: Gasto[]; // { id: string; tipo: 'investimento'|'manutencao'; descricao: string; valor: number; data: string; }
}
```

### Padrão de Supabase + localStorage (SEMPRE seguir este padrão)
```typescript
import { supabase, supabaseDisponivel } from '../lib/supabase';

// Em cada operação:
if (!supabaseDisponivel) {
  // fallback localStorage
  return;
}
// operação Supabase
```

### Estrutura de Arquivos
```
src/
  components/
    Cards/        → VeiculoCard.tsx, CategoriaCard.tsx
    Charts/       → BarrasChart.tsx, DonutChart.tsx, ValorizacaoChart.tsx, DistribuicaoPanel.tsx, VeiculoSeletor.tsx
    Filters/      → FiltrosAcervo.tsx
    Forms/        → AddVeiculoForm.tsx, EditarVeiculoForm.tsx
    Gallery/      → FotoCarrossel.tsx, FotoPlaceholder.tsx
    Gastos/       → ControleGastos.tsx
    Layout/       → Header.tsx, Toast.tsx, BackendStatus.tsx
    Modals/       → VeiculoModal.tsx, ConfirmModal.tsx
    vehicles/     → AIValueFetcher.tsx
  hooks/          → useVeiculos.ts, useTheme.ts, useIA.ts
  pages/          → Inicio.tsx, Acervo.tsx, Adicionar.tsx, Favoritos.tsx, Valores.tsx
  services/       → veiculosDB.ts, geminiService.ts, groqService.ts, fipeService.ts
  types/          → veiculo.ts
  lib/            → supabase.ts
  utils/          → api.ts, formatters.ts, vehicleColors.ts
```

### Como adicionar uma nova página
1. Criar `src/pages/NovaPagina.tsx`
2. Importar e adicionar `<Route>` em `src/App.tsx`
3. Adicionar link no `src/components/Layout/Header.tsx`

### Como o App.tsx passa props
O `App.tsx` controla estado central via `useVeiculos()` e passa `veiculos`, `theme`, funções como `atualizar`, `remover`, etc. para as páginas via props.

---

## FEATURE A1 — Comparador de Veículos

### O que é
Uma página `/comparar` onde o usuário seleciona 2 ou 3 veículos do acervo e vê uma tabela lado a lado comparando: specs técnicos, valores (mercado vs FIPE), gastos totais, quilometragem, e gráfico de valorização histórica.

### Implementação

**1. Criar `src/pages/Comparar.tsx`**
- Seletor múltiplo (máx 3) de veículos usando `VeiculoCard` compacto ou dropdown
- Tabela comparativa lado a lado com as seguintes linhas:
  - Foto (primeira foto ou placeholder)
  - Marca / Modelo / Ano
  - Tipo / Cor / Combustível / Câmbio
  - Quilometragem (`.font-data`)
  - Valor de Mercado (`.font-data`, formato `R$ X.XXX.XXX`)
  - Valor FIPE (`.font-data`)
  - Diferença Mercado vs FIPE (badge colorido: verde se mercado > FIPE, vermelho se menor)
  - Total Gastos Investimento (soma de `gastos.filter(g => g.tipo === 'investimento')`)
  - Total Gastos Manutenção (soma de `gastos.filter(g => g.tipo === 'manutencao')`)
  - Custo Total (valor compra + todos gastos)
  - Motor / Potência / Torque (de `fichatecnica`)
  - Aceleração 0-100 / Velocidade Máxima
  - Consumo Urbano / Estrada
- Destacar coluna do "vencedor" em cada linha (ex: maior valor, menor km, maior potência)
- Gráfico de linha (Recharts `LineChart`) com histórico de valorização dos veículos selecionados sobrepostos — cores distintas por veículo

**2. Adicionar rota em `src/App.tsx`**
```tsx
import Comparar from './pages/Comparar';
// dentro de <Routes>:
<Route path="/comparar" element={<Comparar veiculos={veiculos} theme={theme} />} />
```

**3. Adicionar link no `Header.tsx`**
- Ícone: `GitCompare` do lucide-react
- Label: "Comparar"

**Formatação de valores:**
```typescript
const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const formatarKm = (v: number) => `${v.toLocaleString('pt-BR')} km`;
```

---

## FEATURE A2 — Calculadora de Depreciação

### O que é
Card/seção dentro da página de detalhes do veículo (`VeiculoModal.tsx`) mostrando: curva de depreciação projetada para os próximos 3 anos baseada no histórico de `historicovalorizacao`, com gráfico de linha (Recharts) e tabela de valores projetados.

### Implementação

**1. Criar `src/components/Charts/DepreciacaoChart.tsx`**

Lógica de cálculo:
```typescript
// Calcular taxa de variação média anual do histórico
function calcularTaxaAnual(historico: HistoricoValor[]): number {
  if (historico.length < 2) return -0.08; // padrão: -8% ao ano
  const ordenado = [...historico].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const primeiro = ordenado[0];
  const ultimo = ordenado[ordenado.length - 1];
  const anos = (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (anos < 0.1) return -0.08;
  const taxa = (ultimo.valorMercado - primeiro.valorMercado) / primeiro.valorMercado / anos;
  return Math.max(-0.3, Math.min(0.3, taxa)); // clamp entre -30% e +30%
}

// Gerar pontos futuros
function projetarValores(valorAtual: number, taxa: number, anos: number): { ano: string; valor: number }[] {
  return Array.from({ length: anos + 1 }, (_, i) => ({
    ano: String(new Date().getFullYear() + i),
    valor: Math.round(valorAtual * Math.pow(1 + taxa, i)),
  }));
}
```

Props do componente:
```typescript
interface Props {
  veiculo: Veiculo;
  theme: 'dark' | 'light';
}
```

Exibir:
- Gráfico `LineChart` Recharts com linha de projeção (pontilhada) e histórico real (sólida)
- Tabela abaixo: Ano | Valor Projetado | Variação %
- Badge: "Tendência de valorização" ou "Tendência de depreciação"

**2. Adicionar aba "Depreciação" no `VeiculoModal.tsx`**

---

## FEATURE A3 — ROI / Rentabilidade por Veículo

### O que é
Card dentro do `VeiculoModal.tsx` calculando: valor pago na compra (primeiro registro de `gastos` tipo `investimento`) + todos os gastos → vs valor de mercado atual → ROI em % e em R$.

### Implementação

**1. Criar `src/components/Cards/RoiCard.tsx`**

Cálculo:
```typescript
const totalInvestido = veiculo.gastos
  .filter(g => g.tipo === 'investimento')
  .reduce((acc, g) => acc + g.valor, 0);
const totalManutencao = veiculo.gastos
  .filter(g => g.tipo === 'manutencao')
  .reduce((acc, g) => acc + g.valor, 0);
const custoTotal = totalInvestido + totalManutencao;
const valorAtual = veiculo.valorMercado;
const roi = custoTotal > 0 ? ((valorAtual - custoTotal) / custoTotal) * 100 : 0;
const lucroOuPrejuizo = valorAtual - custoTotal;
```

Exibir 4 KPI cards em grid 2x2:
- Total Investido (compra)
- Total em Manutenção
- Custo Total
- ROI % (badge verde se positivo, vermelho se negativo)
- Lucro/Prejuízo em R$ (verde/vermelho)

**2. Adicionar aba "ROI" no `VeiculoModal.tsx`**

---

## FEATURE A4 — Timeline da Coleção

### O que é
Uma seção na página `Inicio.tsx` ou nova página `/timeline` mostrando linha do tempo vertical de todos os eventos: veículo adicionado, manutenção registrada, atualização de valor, etc. Ordenado do mais recente para o mais antigo.

### Implementação

**1. Criar `src/components/Charts/TimelineColecao.tsx`**

Montar lista de eventos a partir dos dados existentes:
```typescript
interface EventoTimeline {
  id: string;
  tipo: 'aquisicao' | 'manutencao' | 'investimento' | 'valorizacao' | 'atualizacao';
  data: string;
  titulo: string;
  descricao: string;
  veiculoId: string;
  veiculoNome: string;
  valor?: number;
}

function montarEventos(veiculos: Veiculo[]): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];
  for (const v of veiculos) {
    // Primeiro gasto de investimento = aquisição
    const gastoAquisicao = v.gastos
      .filter(g => g.tipo === 'investimento')
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];
    if (gastoAquisicao) {
      eventos.push({ tipo: 'aquisicao', data: gastoAquisicao.data, titulo: `${v.marca} ${v.modelo} adquirido`, descricao: `${v.ano} • ${v.cor}`, veiculoId: v.id, veiculoNome: `${v.marca} ${v.modelo}`, valor: gastoAquisicao.valor, id: `acq-${v.id}` });
    }
    // Demais gastos
    for (const g of v.gastos) {
      if (g === gastoAquisicao) continue;
      eventos.push({ tipo: g.tipo, data: g.data, titulo: g.descricao, descricao: `${v.marca} ${v.modelo}`, veiculoId: v.id, veiculoNome: `${v.marca} ${v.modelo}`, valor: g.valor, id: g.id });
    }
    // Histórico de valorização
    for (const h of v.historicovalorizacao) {
      eventos.push({ tipo: 'valorizacao', data: h.data, titulo: `Atualização de valor`, descricao: `${v.marca} ${v.modelo} • ${h.fonte}`, veiculoId: v.id, veiculoNome: `${v.marca} ${v.modelo}`, valor: h.valorMercado, id: `val-${v.id}-${h.data}` });
    }
  }
  return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}
```

Renderizar como lista vertical com linha conectora, ícone por tipo, e card com infos.

**2. Adicionar seção "Timeline" na página `Inicio.tsx` ou criar página `/timeline`**

---

## FEATURE A5 — Alertas de Valorização/Desvalorização

### O que é
Sistema de alertas que aparece como banner/Toast na `Inicio.tsx`: detecta veículos que variaram mais de X% desde a última atualização. Configurável pelo usuário (threshold em %).

### Implementação

**1. Criar `src/components/Layout/AlertasValor.tsx`**

Lógica:
```typescript
function detectarAlertas(veiculos: Veiculo[], thresholdPct: number = 10) {
  return veiculos
    .filter(v => v.historicovalorizacao.length >= 2)
    .map(v => {
      const ordenado = [...v.historicovalorizacao].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      const atual = ordenado[0].valorMercado;
      const anterior = ordenado[1].valorMercado;
      const variacao = ((atual - anterior) / anterior) * 100;
      return { veiculo: v, variacao, atual, anterior };
    })
    .filter(a => Math.abs(a.variacao) >= thresholdPct);
}
```

Exibir cards de alerta: ícone de tendência (TrendingUp/TrendingDown), nome do veículo, variação em % e R$, badge de data.

**2. Usar `localStorage` para salvar o threshold configurado pelo usuário**
```typescript
const [threshold, setThreshold] = useState(() => Number(localStorage.getItem('alerta_threshold') ?? '10'));
```

**3. Adicionar `<AlertasValor>` no topo da `Inicio.tsx`**

---

## INSTRUÇÕES GERAIS PARA TODAS AS FEATURES

1. **Nunca hardcode cores** — use `var(--text-primary)`, `var(--bg-card)`, `var(--accent-primary)`, etc.
2. **Recharts usa cores JS** — declare `const isDark = theme === 'dark'` e use ternário: `isDark ? '#F5C400' : '#1D4ED8'`
3. **Sempre formatar moeda** com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })`
4. **Sempre formatar km** com `toLocaleString('pt-BR')` + ` km`
5. **Ícones** sempre do `lucide-react`
6. **Animações** use `transition-all duration-200` ou `animate-fade-in` (já definido no CSS global)
7. **Responsividade** — mobile first: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
8. **Loading states** — spinner com `border-t-transparent animate-spin` estilo do App.tsx
9. **Não criar novos arquivos CSS** — use as classes existentes e `style={{ color: 'var(--x)' }}`
