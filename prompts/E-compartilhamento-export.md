# PROMPT E — Compartilhamento & Export
## Features: E1 Perfil Público da Coleção | E2 Compartilhar Veículo | E3 Exportar CSV/Excel

---

## CONTEXTO COMPLETO DO PROJETO

**Scolfaro Automobili** — dashboard premium de acervo de veículos familiar. Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + Lucide React + Recharts. React Router v7 com `basename={import.meta.env.BASE_URL}`.

### Variáveis de Ambiente
```typescript
import.meta.env.VITE_SUPABASE_URL      // URL do projeto Supabase
import.meta.env.VITE_SUPABASE_ANON_KEY // Chave pública anônima
import.meta.env.VITE_GEMINI_API_KEY    // Google Gemini 2.5 Flash
import.meta.env.VITE_GROQ_API_KEY      // Groq fallback
import.meta.env.VITE_API_URL           // Backend Render (pode estar vazio)
import.meta.env.BASE_URL               // Base URL do app (ex: '/')
```

### Supabase Client
```typescript
import { supabase, supabaseDisponivel } from '../lib/supabase';
// supabaseDisponivel: boolean — true se as env vars estão configuradas
```

### Padrão de Supabase + localStorage fallback
```typescript
if (!supabaseDisponivel) {
  // localStorage fallback
  return;
}
// operação Supabase
```

### Tipos principais
```typescript
interface Veiculo {
  id: string; modelo: string; marca: string; ano: number; placa: string;
  quilometragem: number; tipo: TipoVeiculo; cor: string; combustivel: string;
  cambio: string; valorMercado: number; valorFipe: number;
  codigoFipe?: string; fotos: string[]; favorito: boolean;
  fichatecnica: FichaTecnica; historicovalorizacao: HistoricoValor[];
  gastos: Gasto[]; notas?: string; ultimaAtualizacao: string;
}
interface FichaTecnica {
  motor: string; potencia: string; torque: string; tracao: string;
  aceleracao: string; velocidadeMaxima: string; pesoKg: number;
  capacidadeTanque: number; consumoUrbano: string; consumoRodovia: string;
  dimensoes: string; capacidadePassageiros: number; outros?: string;
}
```

### Classes CSS disponíveis
`.sa-card, .sa-btn-primary, .sa-btn-ghost, .sa-input, .sa-select, .sa-label, .sa-badge, .sa-table, .font-display, .font-data, .empty-state`

### Sistema de tema
`data-theme="dark"` → amarelo `#F5C400`. `data-theme="light"` → azul `#1D4ED8`.
Sempre `var(--token)`. Nunca hex hardcoded.

---

## FEATURE E1 — Perfil Público da Coleção

### O que é
Uma página separada acessível publicamente via URL única (sem login), que exibe a coleção de forma elegante como um "portfólio" de veículos. Não mostra valores financeiros, gastos ou informações privadas — apenas fotos, specs técnicos e dados básicos de cada veículo.

### Arquitetura

O perfil público é uma **rota separada** (`/publico`) com layout completamente diferente do app principal — sem Header de navegação, sem sidebar, sem controles de edição. Estilo galeria/portfólio.

A URL compartilhável fica como: `https://seu-app.vercel.app/publico`

### Implementação

**1. Criar `src/pages/PerfilPublico.tsx`**

Layout:
- Hero section: logo "Scolfaro Automobili" + tagline + contador de veículos
- Grid de veículos: 3 colunas desktop, 2 tablet, 1 mobile
- Card por veículo: foto principal em `aspect-video object-cover`, marca/modelo/ano, specs técnicos básicos (motor, potência, câmbio, combustível), SEM valor de mercado, SEM FIPE, SEM gastos, SEM placa
- Footer: "© Scolfaro Automobili — Acervo Privado"
- Fundo sempre escuro (preto/cinza escuro) independente do tema do usuário
- Botão de voltar para o app: só aparece se detectar que o usuário está logado (verificar `supabaseDisponivel` ou um flag em localStorage)

```tsx
// NUNCA exibir na página pública:
// - valorMercado, valorFipe
// - placa
// - gastos
// - notas
// - historicovalorizacao

// Exibir na página pública:
// - fotos
// - marca, modelo, ano, cor, tipo
// - combustivel, cambio, quilometragem (opcional)
// - fichatecnica: motor, potencia, torque, aceleracao, velocidadeMaxima
```

Busca de dados:
```typescript
// Em PerfilPublico, buscar direto do Supabase sem autenticação (RLS permite SELECT público)
import { supabase } from '../lib/supabase';

useEffect(() => {
  if (!supabaseDisponivel) {
    // Fallback: ler localStorage (somente funciona no mesmo device/browser)
    const dados = JSON.parse(localStorage.getItem('scolfaro_veiculos') ?? '[]');
    setVeiculos(dados);
    return;
  }
  supabase.from('veiculos').select('*').order('created_at', { ascending: false })
    .then(({ data }) => setVeiculos((data ?? []).map(fromDB)))
    .catch(() => setVeiculos([]));
}, []);
```

**2. Adicionar rota em `App.tsx`** (FORA do layout principal)
```tsx
// Antes do return principal, tratar a rota pública separadamente:
// Opção mais simples: adicionar a rota /publico dentro do BrowserRouter existente mas sem Header
<Route path="/publico" element={<PerfilPublico />} />
```

Para excluir o Header nessa rota:
```tsx
// No App.tsx, verificar a rota atual
import { useLocation } from 'react-router-dom';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isPublico = location.pathname === '/publico';
  return (
    <>
      {!isPublico && <Header ... />}
      {children}
    </>
  );
}
```

**3. Botão de acesso no `Header.tsx`**
- Ícone: `Globe` do lucide-react
- Label: "Perfil Público"
- Abre em nova aba: `<a href="/publico" target="_blank" rel="noopener noreferrer">`

---

## FEATURE E2 — Compartilhar Veículo Individual

### O que é
Botão "Compartilhar" dentro do `VeiculoModal.tsx` que gera um link para a ficha pública do veículo específico. A ficha pública abre em uma página dedicada (`/veiculo/[id]`) mostrando só fotos e specs (sem valores financeiros).

### Implementação

**1. Criar `src/pages/VeiculoPublico.tsx`**

Rota: `/veiculo/:id`

Layout similar ao `PerfilPublico.tsx` mas focado em um veículo:
- Carrossel de fotos em destaque (grande, tela cheia em mobile)
- Header com marca/modelo/ano em tipografia grande (`font-display`)
- Grid de specs técnicos
- Galeria de fotos adicionais em thumbnails
- Botão: "Ver coleção completa" → link para `/publico`
- SEM valores financeiros, SEM placa, SEM gastos

```typescript
// Busca o veículo pelo ID
import { useParams } from 'react-router-dom';
import { supabase, supabaseDisponivel } from '../lib/supabase';
import { fromDB } from '../services/veiculosDB'; // exportar a função fromDB

const { id } = useParams<{ id: string }>();

useEffect(() => {
  if (!id) return;
  if (!supabaseDisponivel) {
    const lista: Veiculo[] = JSON.parse(localStorage.getItem('scolfaro_veiculos') ?? '[]');
    setVeiculo(lista.find(v => v.id === id) ?? null);
    return;
  }
  supabase.from('veiculos').select('*').eq('id', id).single()
    .then(({ data }) => setVeiculo(data ? fromDB(data) : null));
}, [id]);
```

**2. Botão Compartilhar no `VeiculoModal.tsx`**

```typescript
const copiarLink = async (veiculoId: string) => {
  const url = `${window.location.origin}/veiculo/${veiculoId}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('success', 'Link copiado!');
  } catch {
    // Fallback para browsers sem clipboard API
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('success', 'Link copiado!');
  }
};
```

No JSX do `VeiculoModal.tsx`:
```tsx
<button className="sa-btn-ghost flex items-center gap-2" onClick={() => copiarLink(veiculo.id)}>
  <Share2 size={16} /> Compartilhar
</button>
```

**3. Adicionar rota em `App.tsx`**
```tsx
import VeiculoPublico from './pages/VeiculoPublico';
<Route path="/veiculo/:id" element={<VeiculoPublico />} />
```

**4. Exportar `fromDB` no `veiculosDB.ts`**
A função `fromDB` (snake_case → camelCase) precisa ser exportada para uso nas páginas públicas:
```typescript
// Em src/services/veiculosDB.ts, mudar de:
const fromDB = (r: any): Veiculo => ({ ... });
// Para:
export const fromDB = (r: any): Veiculo => ({ ... });
```

---

## FEATURE E3 — Exportar CSV / Excel

### O que é
Botão "Exportar" na página `Acervo.tsx` e `Valores.tsx` que gera um arquivo CSV com todos os dados da coleção — compatível com Excel, Google Sheets, etc. Inclui: dados básicos, valores, specs técnicos, totais de gastos.

### Implementação (sem biblioteca externa — CSV puro)

**1. Criar `src/utils/exportCSV.ts`**
```typescript
import type { Veiculo } from '../types/veiculo';

function escaparCSV(valor: string | number | undefined | null): string {
  if (valor === null || valor === undefined) return '';
  const str = String(valor);
  // Escapar aspas e envolver em aspas se contiver vírgula, aspas ou quebra de linha
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportarColecaoCSV(veiculos: Veiculo[], nomeArquivo = 'scolfaro-colecao'): void {
  const cabecalho = [
    'Marca', 'Modelo', 'Ano', 'Tipo', 'Cor', 'Combustivel', 'Cambio',
    'Quilometragem', 'Placa', 'Valor Mercado (R$)', 'Valor FIPE (R$)',
    'Diferenca Mercado vs FIPE (R$)', 'Diferenca %',
    'Total Investimento (R$)', 'Total Manutencao (R$)', 'Custo Total (R$)',
    'Motor', 'Potencia', 'Torque', 'Tracao', 'Aceleracao 0-100',
    'Velocidade Maxima', 'Consumo Urbano', 'Consumo Rodovia',
    'Favorito', 'Ultima Atualizacao', 'Codigo FIPE',
  ];

  const linhas = veiculos.map(v => {
    const totalInvestimento = v.gastos
      .filter(g => g.tipo === 'investimento')
      .reduce((s, g) => s + g.valor, 0);
    const totalManutencao = v.gastos
      .filter(g => g.tipo === 'manutencao')
      .reduce((s, g) => s + g.valor, 0);
    const custoTotal = totalInvestimento + totalManutencao;
    const difValor = v.valorMercado - v.valorFipe;
    const difPct = v.valorFipe > 0 ? ((v.valorMercado - v.valorFipe) / v.valorFipe * 100).toFixed(1) : '';

    return [
      v.marca, v.modelo, v.ano, v.tipo, v.cor, v.combustivel, v.cambio,
      v.quilometragem, v.placa, v.valorMercado, v.valorFipe,
      difValor, difPct,
      totalInvestimento, totalManutencao, custoTotal,
      v.fichatecnica?.motor ?? '', v.fichatecnica?.potencia ?? '',
      v.fichatecnica?.torque ?? '', v.fichatecnica?.tracao ?? '',
      v.fichatecnica?.aceleracao ?? '', v.fichatecnica?.velocidadeMaxima ?? '',
      v.fichatecnica?.consumoUrbano ?? '', v.fichatecnica?.consumoRodovia ?? '',
      v.favorito ? 'Sim' : 'Não',
      v.ultimaAtualizacao ? new Date(v.ultimaAtualizacao).toLocaleDateString('pt-BR') : '',
      v.codigoFipe ?? '',
    ].map(escaparCSV).join(',');
  });

  const conteudo = [cabecalho.join(','), ...linhas].join('\n');
  // BOM para Excel reconhecer UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exportar também os gastos detalhados (um arquivo separado)
export function exportarGastosCSV(veiculos: Veiculo[], nomeArquivo = 'scolfaro-gastos'): void {
  const cabecalho = [
    'Veiculo', 'Marca', 'Modelo', 'Ano', 'Tipo Gasto', 'Descricao', 'Valor (R$)', 'Data',
  ];
  const linhas = veiculos.flatMap(v =>
    v.gastos.map(g => [
      `${v.marca} ${v.modelo} ${v.ano}`, v.marca, v.modelo, v.ano,
      g.tipo === 'investimento' ? 'Investimento' : 'Manutenção',
      g.descricao, g.valor,
      new Date(g.data).toLocaleDateString('pt-BR'),
    ].map(escaparCSV).join(','))
  );
  const conteudo = [cabecalho.join(','), ...linhas].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**2. Adicionar botões de exportação na `Acervo.tsx`**
```tsx
import { exportarColecaoCSV, exportarGastosCSV } from '../utils/exportCSV';

// Menu dropdown de exportação (usar estado simples de toggle):
const [menuExportAberto, setMenuExportAberto] = useState(false);

// JSX:
<div className="relative">
  <button className="sa-btn-ghost flex items-center gap-2" onClick={() => setMenuExportAberto(!menuExportAberto)}>
    <Download size={16} /> Exportar
  </button>
  {menuExportAberto && (
    <div className="absolute right-0 top-10 z-20 sa-card p-2 flex flex-col gap-1 min-w-[200px]">
      <button className="sa-btn-ghost text-left text-sm px-3 py-2" onClick={() => { exportarColecaoCSV(veiculos); setMenuExportAberto(false); }}>
        <FileSpreadsheet size={14} className="inline mr-2" />
        Coleção (CSV/Excel)
      </button>
      <button className="sa-btn-ghost text-left text-sm px-3 py-2" onClick={() => { exportarGastosCSV(veiculos); setMenuExportAberto(false); }}>
        <Receipt size={14} className="inline mr-2" />
        Gastos detalhados (CSV)
      </button>
    </div>
  )}
</div>
```

**3. Adicionar botão na `Valores.tsx`** — mesmo padrão, exportar só os dados de valores/comparativos.

---

## INSTRUÇÕES GERAIS

### Segurança nas páginas públicas
1. **NUNCA** exibir nas páginas `/publico` e `/veiculo/:id`:
   - Valores financeiros (valorMercado, valorFipe, gastos)
   - Placa do veículo
   - Notas pessoais
   - Histórico de valorização
   - Qualquer dado sensível da família
2. **Supabase RLS:** As policies existentes permitem SELECT público (sem login), o que é correto para o perfil público. Não modificar as RLS policies.
3. **Meta tags** para compartilhamento social (Open Graph):
```tsx
// Em VeiculoPublico.tsx, usar useEffect para atualizar <title>:
useEffect(() => {
  if (veiculo) {
    document.title = `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano} — Scolfaro Automobili`;
  }
}, [veiculo]);
```

### Rotas públicas no `vercel.json`
O `vercel.json` já tem `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`, então todas as rotas funcionam em produção no Vercel sem configuração adicional.

### CSV e Excel
- Sempre incluir BOM (`\uFEFF`) para Excel reconhecer UTF-8 corretamente (evita caracteres estranhos em acentos)
- Nomes de arquivo com data: `${nome}-${new Date().toISOString().slice(0, 10)}.csv`
- Não usar bibliotecas externas para CSV simples — a implementação pura é mais leve e suficiente

### Export para veiculosDB.ts
```typescript
// Adicionar export à função fromDB em src/services/veiculosDB.ts
// Linha atual:
const fromDB = (r: any): Veiculo => ({ ... });
// Mudar para:
export const fromDB = (r: any): Veiculo => ({ ... });
```

### Ícones para esta categoria (lucide-react)
```typescript
import { Globe, Share2, Download, FileSpreadsheet, Receipt, Copy, Check, Link } from 'lucide-react';
```
