# PROMPT C — Visual & UX
## Features: C1 Modo Showroom | C2 Relatório PDF | C3 QR Code | C4 Tags | C5 Animações Aprimoradas

---

## CONTEXTO COMPLETO DO PROJETO

**Scolfaro Automobili** — dashboard premium de acervo de veículos familiar, estilo Bloomberg/Porsche Digital. Painel de controle privado, não site de vendas.

### Tech Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4
- Lucide React (ícones), Recharts (gráficos), React Router v7
- Supabase + fallback localStorage
- Fontes: Syne (`.font-display`), DM Sans (body), JetBrains Mono (`.font-data`)

### Sistema de Tema
```
data-theme="dark"  → amarelo #F5C400 como accent, fundo escuro
data-theme="light" → azul #1D4ED8 como accent, fundo claro
```
Sempre use `var(--token)`. Nunca hex hardcoded (exceto SVG/Recharts).

### Variáveis de Ambiente
```
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  → Supabase
VITE_GEMINI_API_KEY                          → Gemini 2.5 Flash
VITE_GROQ_API_KEY                            → Groq fallback
VITE_API_URL                                 → Backend Render
```

### Classes CSS existentes
```
.sa-card, .sa-btn-primary, .sa-btn-ghost, .sa-input, .sa-select,
.sa-chip, .sa-badge, .sa-table, .sa-label, .vehicle-card, .empty-state,
.font-display, .font-data
```

### Tipos (`src/types/veiculo.ts`)
```typescript
interface Veiculo {
  id: string; modelo: string; marca: string; ano: number;
  placa: string; quilometragem: number; tipo: TipoVeiculo;
  valorMercado: number; valorFipe: number; cor: string;
  combustivel: string; cambio: string;
  fotos: string[]; // base64 data URLs ou URLs externas
  fichatecnica: FichaTecnica;
  historicovalorizacao: HistoricoValor[];
  gastos: Gasto[];
  notas?: string;
  favorito: boolean;
  ultimaAtualizacao: string;
}
```

---

## FEATURE C1 — Modo Showroom

### O que é
Uma rota `/showroom` que exibe os veículos como exposição de museu: tela cheia, fundo preto absoluto, slideshow automático das fotos em tela cheia, dados do veículo sobrepostos com tipografia elegante. Controlado por teclado (←/→) e clique. ESC para sair.

### Implementação

**1. Criar `src/pages/Showroom.tsx`**

```typescript
interface Props {
  veiculos: Veiculo[];
}
```

Layout:
- Fundo: `#000000` fixo (não `var(--bg-primary)`, pois o showroom é sempre preto)
- Foto em `object-cover` ocupando 100vh 100vw
- Overlay gradiente: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)`
- Dados sobrepostos no canto inferior esquerdo:
  - Marca em `font-display text-white/50 text-sm tracking-widest uppercase`
  - Modelo em `font-display text-white text-5xl font-bold`
  - Ano em `font-data text-white/60 text-xl`
  - Valor de mercado em `font-data text-[#F5C400] text-2xl` (sempre amarelo no showroom)
  - Quilometragem e tipo em `text-white/50 text-sm`
- Navegação:
  - Setas esquerda/direita para trocar de veículo
  - Pontos indicadores no centro inferior
  - Botão ESC / X no canto superior direito (ícone `X` lucide)
  - Slideshow automático: trocar foto a cada 5 segundos
- Barra inferior: thumbnails clicáveis dos outros veículos

**Lógica de slideshow:**
```typescript
const [veiculoIdx, setVeiculoIdx] = useState(0);
const [fotoIdx, setFotoIdx] = useState(0);

// Auto-avançar fotos
useEffect(() => {
  const intervalo = setInterval(() => {
    const v = veiculos[veiculoIdx];
    if (!v || v.fotos.length <= 1) return;
    setFotoIdx(prev => (prev + 1) % v.fotos.length);
  }, 5000);
  return () => clearInterval(intervalo);
}, [veiculoIdx, veiculos]);

// Teclado
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setVeiculoIdx(prev => (prev + 1) % veiculos.length);
    if (e.key === 'ArrowLeft') setVeiculoIdx(prev => (prev - 1 + veiculos.length) % veiculos.length);
    if (e.key === 'Escape') navigate('/');
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [veiculos.length]);
```

**Transição de foto:**
```tsx
<img
  key={`${veiculoIdx}-${fotoIdx}`}
  src={foto}
  className="absolute inset-0 w-full h-full object-cover animate-fade-in"
  style={{ transition: 'opacity 0.8s ease-in-out' }}
/>
```

**2. Adicionar rota em `App.tsx`**
```tsx
<Route path="/showroom" element={<Showroom veiculos={veiculos} />} />
```

**3. Adicionar botão no `Header.tsx`**
- Ícone: `Presentation` do lucide-react
- Label: "Showroom"
- Abre em nova aba: `<a href="/showroom" target="_blank">`

---

## FEATURE C2 — Relatório PDF

### O que é
Botão "Exportar PDF" dentro do `VeiculoModal.tsx` e na página `Acervo.tsx` (exportar coleção inteira). Gera PDF com ficha completa: foto, dados, especificações técnicas, histórico de valores, gastos.

### Biblioteca recomendada
Use `@react-pdf/renderer` — mantida, TypeScript-first, sem dependências externas:
```bash
npm install @react-pdf/renderer
```

### Implementação

**1. Criar `src/components/PDF/FichaVeiculoPDF.tsx`**
```typescript
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#0a0a0a', color: '#ffffff', fontFamily: 'Helvetica' },
  titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#888888', marginBottom: 24 },
  secao: { marginBottom: 16 },
  secaoTitulo: { fontSize: 10, color: '#F5C400', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  campo: { width: '48%', marginBottom: 8 },
  label: { fontSize: 8, color: '#666', marginBottom: 2 },
  valor: { fontSize: 11, color: '#ffffff' },
  foto: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 4, marginBottom: 16 },
  tabela: { marginTop: 8 },
  tabelaHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 6 },
  tabelaRow: { flexDirection: 'row', padding: 6, borderBottom: '1px solid #2a2a2a' },
  tabelaCol: { flex: 1, fontSize: 9 },
});

interface Props {
  veiculo: Veiculo;
}

export function FichaVeiculoPDF({ veiculo }: Props) {
  const totalGastos = veiculo.gastos.reduce((s, g) => s + g.valor, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Foto principal */}
        {veiculo.fotos[0] && <Image src={veiculo.fotos[0]} style={styles.foto} />}
        
        {/* Cabeçalho */}
        <Text style={styles.titulo}>{veiculo.marca} {veiculo.modelo}</Text>
        <Text style={styles.subtitulo}>{veiculo.ano} • {veiculo.cor} • {veiculo.placa}</Text>
        
        {/* Dados básicos */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Informações</Text>
          <View style={styles.grid}>
            {[
              ['Tipo', veiculo.tipo],
              ['Combustível', veiculo.combustivel],
              ['Câmbio', veiculo.cambio],
              ['Quilometragem', `${veiculo.quilometragem.toLocaleString('pt-BR')} km`],
              ['Valor de Mercado', veiculo.valorMercado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })],
              ['Valor FIPE', veiculo.valorFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })],
            ].map(([l, v]) => (
              <View key={l} style={styles.campo}>
                <Text style={styles.label}>{l}</Text>
                <Text style={styles.valor}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Ficha técnica */}
        {/* Gastos */}
        {/* Histórico de valorização */}
      </Page>
    </Document>
  );
}
```

**2. Criar `src/utils/exportPDF.ts`**
```typescript
import { pdf } from '@react-pdf/renderer';
import { FichaVeiculoPDF } from '../components/PDF/FichaVeiculoPDF';
import type { Veiculo } from '../types/veiculo';
import React from 'react';

export async function exportarVeiculoPDF(veiculo: Veiculo): Promise<void> {
  const blob = await pdf(React.createElement(FichaVeiculoPDF, { veiculo })).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${veiculo.marca}-${veiculo.modelo}-${veiculo.ano}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarColecaoPDF(veiculos: Veiculo[]): Promise<void> {
  // Uma página por veículo
  const blob = await pdf(React.createElement(ColecaoPDF, { veiculos })).toBlob();
  // ... mesmo padrão de download
}
```

**3. Adicionar botão no `VeiculoModal.tsx`**
```tsx
import { exportarVeiculoPDF } from '../../utils/exportPDF';
// ...
<button className="sa-btn-ghost" onClick={() => exportarVeiculoPDF(veiculo)}>
  <FileDown size={16} /> Exportar PDF
</button>
```

---

## FEATURE C3 — QR Code por Veículo

### O que é
Gera um QR code que ao ser escaneado abre a ficha pública do veículo (ou a URL do app na página de detalhes). Exibido como modal dentro do `VeiculoModal.tsx` e pode ser impresso/salvo como PNG.

### Biblioteca
```bash
npm install qrcode.react
```

### Implementação

**1. Criar `src/components/Modals/QRCodeModal.tsx`**
```typescript
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  veiculo: Veiculo;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ veiculo, isOpen, onClose }: Props) {
  const url = `${window.location.origin}/veiculo/${veiculo.id}`;
  
  const baixarPNG = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${veiculo.marca}-${veiculo.modelo}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="sa-card p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <h3 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          QR Code — {veiculo.marca} {veiculo.modelo}
        </h3>
        <div id="qr-canvas" className="p-4 rounded-lg bg-white">
          <QRCodeSVG
            value={url}
            size={200}
            fgColor="#000000"
            bgColor="#ffffff"
            level="H"
            imageSettings={{
              src: '/favicon.ico',
              height: 24,
              width: 24,
              excavate: true,
            }}
          />
        </div>
        <p className="text-xs text-center font-data" style={{ color: 'var(--text-muted)' }}>
          {url}
        </p>
        <div className="flex gap-3">
          <button className="sa-btn-primary" onClick={baixarPNG}>
            Baixar PNG
          </button>
          <button className="sa-btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
```

**2. Adicionar botão no `VeiculoModal.tsx`**
- Ícone: `QrCode` do lucide-react

---

## FEATURE C4 — Tags Personalizadas

### O que é
Sistema de etiquetas livres por veículo: "À venda", "Em restauração", "Emprestado", "Clássico", "Favorito", etc. Tags coloridas aparecem no `VeiculoCard.tsx` e servem como filtro no `Acervo.tsx`.

### Novo Tipo
```typescript
// Adicionar em src/types/veiculo.ts
export interface Tag {
  id: string;
  label: string;
  cor: string; // hex, ex: '#F5C400'
}

// Adicionar em Veiculo:
tags?: Tag[];
```

### Implementação

**1. Criar `src/components/Cards/TagsVeiculo.tsx`**
```typescript
// Tags pré-definidas sugeridas (mas o usuário pode criar livres)
const TAGS_SUGERIDAS: Omit<Tag, 'id'>[] = [
  { label: 'À venda', cor: '#22c55e' },
  { label: 'Em restauração', cor: '#f97316' },
  { label: 'Emprestado', cor: '#3b82f6' },
  { label: 'Favorito', cor: '#F5C400' },
  { label: 'Clássico', cor: '#a855f7' },
  { label: 'Exibição', cor: '#ec4899' },
  { label: 'Manutenção', cor: '#ef4444' },
];
```

Componente:
- Chips de tags com cor de fundo semitransparente (`${tag.cor}33`) e borda (`${tag.cor}`)
- Botão "+" para adicionar tag: abre dropdown com sugestões + campo livre + color picker nativo (`<input type="color">`)
- X para remover tag

**2. Mostrar tags no `VeiculoCard.tsx`**
```tsx
// No card, abaixo das infos principais:
{veiculo.tags && veiculo.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {veiculo.tags.map(tag => (
      <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: `${tag.cor}22`, color: tag.cor, border: `1px solid ${tag.cor}44` }}>
        {tag.label}
      </span>
    ))}
  </div>
)}
```

**3. Adicionar filtro por tag no `FiltrosAcervo.tsx`**
```typescript
// Coletar todas as tags únicas
const todasTags = [...new Map(
  veiculos.flatMap(v => v.tags ?? []).map(t => [t.label, t])
).values()];
```

**4. Salvar como JSONB no Supabase** (mesmo padrão dos outros campos JSONB)

---

## FEATURE C5 — Animações e Micro-interações Aprimoradas

### O que é
Melhorar a experiência visual com: animações de entrada escalonadas nos cards, transições de página suaves, hover states mais expressivos, e skeleton loading screens durante carregamento.

### Implementação

**1. Adicionar animações CSS em `src/index.css`**
```css
/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    var(--bg-secondary) 25%,
    var(--bg-card) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

/* Fade in up com delay escalonado */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out both;
}
/* Gerar .stagger-1 até .stagger-12 */
.stagger-1  { animation-delay: 0.05s; }
.stagger-2  { animation-delay: 0.10s; }
.stagger-3  { animation-delay: 0.15s; }
.stagger-4  { animation-delay: 0.20s; }
.stagger-5  { animation-delay: 0.25s; }
.stagger-6  { animation-delay: 0.30s; }
.stagger-7  { animation-delay: 0.35s; }
.stagger-8  { animation-delay: 0.40s; }
.stagger-9  { animation-delay: 0.45s; }
.stagger-10 { animation-delay: 0.50s; }
.stagger-11 { animation-delay: 0.55s; }
.stagger-12 { animation-delay: 0.60s; }

/* Hover scale suave nos cards */
.vehicle-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.vehicle-card:hover {
  transform: translateY(-2px);
}

/* Transição de página */
.page-transition {
  animation: fadeInUp 0.3s ease-out both;
}
```

**2. Criar `src/components/Layout/SkeletonCard.tsx`**
```tsx
export function SkeletonVeiculoCard() {
  return (
    <div className="sa-card p-4 space-y-3">
      <div className="skeleton h-48 w-full rounded" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
```

**3. Aplicar nos grids do `Acervo.tsx`**
```tsx
// Durante loading, mostrar 6 skeletons
{loading && Array.from({ length: 6 }).map((_, i) => (
  <SkeletonVeiculoCard key={i} />
))}

// Cards reais com stagger
{veiculosFiltrados.map((v, i) => (
  <div key={v.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 12)}`}>
    <VeiculoCard ... />
  </div>
))}
```

**4. Adicionar `page-transition` em cada página**
```tsx
// Em cada page component, wrapper externo:
<div className="page-transition">
  {/* conteúdo */}
</div>
```

---

## INSTRUÇÕES GERAIS

1. **PDF com @react-pdf/renderer**: instalar com `npm install @react-pdf/renderer`. Não usar `jsPDF` (menos preciso para layouts complexos)
2. **QR Code**: instalar com `npm install qrcode.react`
3. **Showroom**: rota separada, sem Header/nav — layout 100% full-screen
4. **Tags**: salvar como JSONB no Supabase. Adicionar `ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';`
5. **CSS global**: adicionar animações em `src/index.css` sem criar novos arquivos de estilo
6. **Performance**: lazy load de imagens com `loading="lazy"` em todos os `<img>`
7. **Acessibilidade**: todos os botões com `aria-label`, modais com `role="dialog"` e `aria-modal="true"`
