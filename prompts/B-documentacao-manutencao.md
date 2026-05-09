# PROMPT B — Documentação & Manutenção
## Features: B1 Agenda de Manutenção | B2 Documentos | B3 Histórico de Proprietários | B4 Controle de Seguro

---

## CONTEXTO COMPLETO DO PROJETO

Você está trabalhando no **Scolfaro Automobili** — dashboard premium de gestão de acervo de veículos familiar, estilo Bloomberg/Porsche Digital.

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **UI:** Lucide React, Recharts, React Router v7
- **Banco:** Supabase (PostgreSQL) + fallback localStorage
- **Tema:** `data-theme="dark"|"light"` no `<html>`. NUNCA `.dark` do Tailwind.
- **Cores:** Sempre `var(--token)` — NUNCA hex hardcoded, exceto Recharts (SVG).

### Variáveis de Ambiente
```
VITE_SUPABASE_URL        → URL do projeto Supabase
VITE_SUPABASE_ANON_KEY   → Chave anônima (pública) do Supabase
VITE_GEMINI_API_KEY      → Google Gemini 2.5 Flash
VITE_GROQ_API_KEY        → Groq (fallback)
VITE_API_URL             → Backend Render (pode estar vazio)
```

### Supabase Storage para Documentos
Para upload de arquivos (PDFs, imagens de documentos):
- Use `supabase.storage.from('documentos').upload(path, file)`
- Bucket: `documentos` (criar no Supabase Dashboard → Storage → New Bucket → nome: `documentos`, público: false)
- URL pública: `supabase.storage.from('documentos').getPublicUrl(path).data.publicUrl`
- Fallback localStorage: converter para base64 com `FileReader` e salvar no veículo

### Padrão Supabase + localStorage
```typescript
import { supabase, supabaseDisponivel } from '../lib/supabase';
if (!supabaseDisponivel) {
  // fallback localStorage
  return;
}
// operação Supabase
```

### Classes CSS existentes
```
.sa-card, .sa-btn-primary, .sa-btn-ghost, .sa-input, .sa-select,
.sa-chip, .sa-badge, .sa-table, .sa-label, .vehicle-card, .empty-state,
.font-display (Syne), .font-data (JetBrains Mono)
```

### Tipos existentes (`src/types/veiculo.ts`)
```typescript
interface Gasto {
  id: string;
  tipo: 'investimento' | 'manutencao';
  descricao: string;
  valor: number;
  data: string;
  createdAt: string;
}

interface Veiculo {
  id: string;
  modelo: string; marca: string; ano: number;
  quilometragem: number;
  gastos: Gasto[];
  notas?: string;
  // ... outros campos
}
```

### Estender o tipo Veiculo
Para adicionar novos campos, edite `src/types/veiculo.ts` adicionando campos opcionais:
```typescript
interface Veiculo {
  // campos existentes...
  agendamentos?: Agendamento[];
  documentos?: DocumentoVeiculo[];
  proprietarios?: Proprietario[];
  seguro?: Seguro;
}
```

E adicione os campos no `toDB` e `fromDB` em `src/services/veiculosDB.ts` e na coluna `veiculos` do Supabase (como JSONB).

### Schema SQL para novos campos (adicionar em `supabase/schema.sql`)
```sql
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS agendamentos JSONB DEFAULT '[]';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS proprietarios JSONB DEFAULT '[]';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS seguro JSONB DEFAULT NULL;
```

---

## FEATURE B1 — Agenda de Manutenção

### O que é
Sistema de agendamentos por veículo: revisões, troca de óleo, IPVA, seguro, inspeção. Cada agendamento tem data, tipo, descrição, km no momento, status (pendente/concluído/atrasado). Aparece como lista dentro do `VeiculoModal.tsx` e como painel global em nova página `/agenda`.

### Novos Tipos
```typescript
// Adicionar em src/types/veiculo.ts
export type TipoAgendamento =
  | 'revisao'
  | 'troca-oleo'
  | 'ipva'
  | 'seguro'
  | 'inspecao'
  | 'pneus'
  | 'freios'
  | 'correia-dentada'
  | 'outro';

export type StatusAgendamento = 'pendente' | 'concluido' | 'atrasado';

export interface Agendamento {
  id: string;
  tipo: TipoAgendamento;
  descricao: string;
  dataAgendada: string;        // ISO string
  kmAgendado?: number;         // quilometragem alvo (ex: a cada 10.000 km)
  dataConcluido?: string;
  status: StatusAgendamento;
  valor?: number;              // custo se já realizado
  notas?: string;
  createdAt: string;
}
```

### Cálculo automático de status
```typescript
function calcularStatus(ag: Agendamento, kmAtual: number): StatusAgendamento {
  if (ag.status === 'concluido') return 'concluido';
  const hoje = new Date();
  const dataAg = new Date(ag.dataAgendada);
  if (dataAg < hoje) return 'atrasado';
  // Verificar por km também
  if (ag.kmAgendado && kmAtual >= ag.kmAgendado) return 'atrasado';
  return 'pendente';
}
```

### Implementação

**1. Criar `src/components/Gastos/AgendaManutenção.tsx`**
- Listagem dos agendamentos do veículo com badge de status (verde/amarelo/vermelho)
- Formulário inline para adicionar novo agendamento
- Botão "Marcar como concluído" que registra `dataConcluido` e oferece adicionar ao controle de gastos
- Ordenar: atrasados primeiro, depois por data mais próxima

**2. Criar `src/pages/Agenda.tsx`**
- Visão global de todos os agendamentos de todos os veículos
- Filtro por: status (pendente/atrasado/concluído), tipo, veículo
- Banner de alerta: "X serviços atrasados" se houver
- Calendário simples (lista agrupada por mês) — NÃO usar biblioteca de calendário, fazer com map simples

**3. Salvar no Supabase**
Nos métodos `atualizar` do `veiculosDB.ts`, o campo `agendamentos` já é salvo junto com o veículo (JSONB).

**4. Rota e Header**
```tsx
// App.tsx
<Route path="/agenda" element={<Agenda veiculos={veiculos} onAtualizar={atualizar} theme={theme} />} />
// Header.tsx — ícone: CalendarClock
```

### Ícones por tipo (lucide-react)
```typescript
const iconeAgendamento = {
  'revisao': 'Wrench',
  'troca-oleo': 'Droplets',
  'ipva': 'FileText',
  'seguro': 'Shield',
  'inspecao': 'ClipboardCheck',
  'pneus': 'Circle',
  'freios': 'AlertCircle',
  'correia-dentada': 'Settings',
  'outro': 'Calendar',
}
```

---

## FEATURE B2 — Documentos por Veículo

### O que é
Upload e visualização de documentos por veículo: CRLV, nota fiscal de compra, apólice de seguro, laudos, manuais. Fotos ou PDFs. Armazenados no Supabase Storage com fallback base64 em localStorage.

### Novos Tipos
```typescript
// Adicionar em src/types/veiculo.ts
export type TipoDocumento =
  | 'crlv'
  | 'nota-fiscal'
  | 'apolice-seguro'
  | 'laudo'
  | 'manual'
  | 'foto-documento'
  | 'outro';

export interface DocumentoVeiculo {
  id: string;
  tipo: TipoDocumento;
  nome: string;
  descricao?: string;
  url: string;          // URL do Supabase Storage OU base64 data URL
  mimeType: string;     // 'application/pdf' | 'image/jpeg' | etc.
  tamanhoBytes: number;
  dataUpload: string;
  vencimento?: string;  // para CRLV, seguro, etc.
}
```

### Implementação

**1. Criar `src/services/documentosService.ts`**
```typescript
import { supabase, supabaseDisponivel } from '../lib/supabase';

const BUCKET = 'documentos';

export async function uploadDocumento(
  veiculoId: string,
  file: File
): Promise<string> {
  if (!supabaseDisponivel) {
    // Fallback: converter para base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  const path = `${veiculoId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removerDocumento(url: string, veiculoId: string): Promise<void> {
  if (!supabaseDisponivel || url.startsWith('data:')) return;
  // Extrair path da URL
  const path = url.split(`/${BUCKET}/`)[1];
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}
```

**2. Criar `src/components/Gallery/DocumentosVeiculo.tsx`**
- Grid de documentos (ícone por tipo, nome, data de upload)
- Click abre visualizador: PDF em iframe, imagens em modal full-screen
- Botão de upload com drag-and-drop (aceita PDF e imagens, máx 10MB)
- Badge de vencimento: vermelho se vencido, amarelo se vence em 30 dias
- Botão de remover com confirmação

**3. Adicionar aba "Documentos" no `VeiculoModal.tsx`**

**4. Criar bucket no Supabase**
Instruções para o usuário criar o bucket via Dashboard:
- Supabase Dashboard → Storage → New Bucket
- Nome: `documentos`
- Público: `false` (privado)
- Policies: INSERT e SELECT para usuários anônimos (já que o projeto usa anon key)

---

## FEATURE B3 — Histórico de Proprietários

### O que é
Registro do histórico de propriedade do veículo: quando foi comprado, de quem, por quanto, e quaisquer vendas passadas. Exibido como linha do tempo dentro do `VeiculoModal.tsx`.

### Novos Tipos
```typescript
// Adicionar em src/types/veiculo.ts
export interface Proprietario {
  id: string;
  nome: string;
  tipo: 'pessoa-fisica' | 'pessoa-juridica' | 'concessionaria' | 'leilao';
  valorTransacao: number;
  dataTransacao: string;
  cidade?: string;
  observacoes?: string;
  ehAtual: boolean;       // true apenas para o proprietário atual
}
```

### Implementação

**1. Criar `src/components/Cards/ProprietariosTimeline.tsx`**
- Lista vertical com linha conectora (CSS, sem biblioteca)
- Cada item: ícone (User2 ou Building2), nome, valor pago, data, cidade
- O proprietário atual tem badge "Atual" destacado em accent
- Formulário de adicionar novo proprietário (compra/venda)
- Cálculo automático: "Possuído por X dias/anos"

**2. Adicionar aba "Proprietários" no `VeiculoModal.tsx`**

**3. Integração com ROI (A3)**
Se o campo `proprietarios` tiver o valor de compra, usar esse como base do ROI em vez do primeiro gasto.

---

## FEATURE B4 — Controle de Seguro

### O que é
Seção dedicada ao seguro do veículo: seguradora, número da apólice, valor segurado, franquia, cobertura, vencimento, e histórico de sinistros. Com alerta visual quando próximo ao vencimento.

### Novos Tipos
```typescript
// Adicionar em src/types/veiculo.ts
export type CoberturaSeguro = 'terceiros' | 'compreensiva' | 'total';

export interface Sinistro {
  id: string;
  data: string;
  descricao: string;
  valorPrejuizo: number;
  valorRecebido: number;
  status: 'aberto' | 'em-analise' | 'pago' | 'negado';
}

export interface Seguro {
  seguradora: string;
  numeroApolice: string;
  valorSegurado: number;
  franquia: number;
  cobertura: CoberturaSeguro;
  premio: number;           // valor pago pelo seguro (mensal ou anual)
  periodoPremio: 'mensal' | 'anual';
  vigenciaInicio: string;
  vigenciaFim: string;
  contato?: string;
  sinistros: Sinistro[];
}
```

### Implementação

**1. Criar `src/components/Cards/SeguroCard.tsx`**
- Card com infos principais: seguradora, apólice, valor segurado, vencimento
- Badge de status: "Vigente" (verde), "Vence em X dias" (amarelo se < 30 dias), "Vencido" (vermelho)
- Seção expandível com detalhes e histórico de sinistros
- Formulário para editar/adicionar seguro e registrar sinistros
- Cálculo: custo total do seguro no período, cobertura vs valor de mercado atual

**2. Adicionar aba "Seguro" no `VeiculoModal.tsx`**

**3. Alerta global**
Na `Inicio.tsx`, mostrar banner: "X veículos com seguro vencendo em 30 dias"
```typescript
const segurosVencendo = veiculos
  .filter(v => v.seguro)
  .filter(v => {
    const dias = (new Date(v.seguro!.vigenciaFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= 30;
  });
```

---

## INSTRUÇÕES GERAIS

1. **Todos os novos campos no tipo `Veiculo` devem ser opcionais** (`campo?: Tipo`) para não quebrar dados existentes
2. **Serialização JSONB**: campos objeto/array são salvos como JSONB no Supabase — adicionar no `toDB` e `fromDB` de `src/services/veiculosDB.ts`
3. **Schema SQL**: rodar os `ALTER TABLE` no Supabase SQL Editor antes de usar em produção
4. **Fallback localStorage**: campos novos são salvos junto com o objeto `Veiculo` no localStorage automaticamente (JSON.stringify)
5. **Nunca hardcode cores** — use `var(--token)`
6. **Validar datas** com `new Date(str).toISOString()` antes de salvar
7. **IDs** sempre `crypto.randomUUID()`
8. **Formatação de moeda**: `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })`
