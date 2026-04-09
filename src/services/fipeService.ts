// src/services/fipeService.ts

const FIPE_BASE = 'https://parallelum.com.br/fipe/api/v2';

type FipeVehicleType = 'cars' | 'motorcycles' | 'trucks';

interface FipeBrand  { code: string; name: string; }
interface FipeModel  { code: string; name: string; }
interface FipeYear   { code: string; name: string; }
interface FipeResult {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  fipeCode: string;
  referenceMonth: string;
}

const mapCombustivelFipe = (combustivel: string): string => ({
  'Gasolina': '1', 'Álcool': '2', 'Etanol': '2',
  'Diesel': '3', 'Elétrico': '4', 'Flex': '5',
  'Híbrido': '6', 'Gás Natural': '7',
}[combustivel] ?? '1');

const mapTipoVeiculo = (tipo: string): FipeVehicleType =>
  tipo === 'moto' ? 'motorcycles' : 'cars';

export interface FipeConsultaInput {
  marca: string;
  modelo: string;
  ano: number;
  combustivel: string;
  tipo: string;
}

export interface FipeConsultaOutput {
  valorFipe: number;
  codigoFipe: string;
  mesReferencia: string;
}

export const buscarValorFipe = async (
  veiculo: FipeConsultaInput
): Promise<FipeConsultaOutput | null> => {
  try {
    const vehicleType = mapTipoVeiculo(veiculo.tipo);
    const combustivelCod = mapCombustivelFipe(veiculo.combustivel);

    // ETAPA 1 — Buscar marcas e encontrar por fuzzy match
    const brandsRes = await fetch(`${FIPE_BASE}/${vehicleType}/brands`);
    if (!brandsRes.ok) throw new Error(`Marcas: ${brandsRes.status}`);
    const brands: FipeBrand[] = await brandsRes.json();

    const marcaNorm = veiculo.marca.toLowerCase().trim();
    const brandMatch = brands.find(b =>
      b.name.toLowerCase().includes(marcaNorm) ||
      marcaNorm.includes(b.name.toLowerCase())
    );
    if (!brandMatch) { console.warn('[FIPE] Marca não encontrada:', veiculo.marca); return null; }

    // ETAPA 2 — Buscar modelos e pontuar por palavras em comum
    const modelsRes = await fetch(`${FIPE_BASE}/${vehicleType}/brands/${brandMatch.code}/models`);
    if (!modelsRes.ok) throw new Error(`Modelos: ${modelsRes.status}`);
    const { models }: { models: FipeModel[] } = await modelsRes.json();

    const modeloWords = veiculo.modelo.toLowerCase().split(' ').filter(w => w.length > 2);
    const scored = models.map(m => ({
      m,
      score: modeloWords.filter(w => m.name.toLowerCase().includes(w)).length,
    })).sort((a, b) => b.score - a.score);

    const modelMatch = scored[0]?.score > 0 ? scored[0].m : null;
    if (!modelMatch) { console.warn('[FIPE] Modelo não encontrado:', veiculo.modelo); return null; }

    // ETAPA 3 — Buscar anos disponíveis
    const yearsRes = await fetch(
      `${FIPE_BASE}/${vehicleType}/brands/${brandMatch.code}/models/${modelMatch.code}/years`
    );
    if (!yearsRes.ok) throw new Error(`Anos: ${yearsRes.status}`);
    const years: FipeYear[] = await yearsRes.json();

    const anoStr = String(veiculo.ano);
    const yearMatch =
      years.find(y => y.code.startsWith(anoStr) && y.code.endsWith(combustivelCod)) ??
      years.find(y => y.code.startsWith(anoStr)) ??
      years[0];

    if (!yearMatch) { console.warn('[FIPE] Ano não encontrado:', veiculo.ano); return null; }

    // ETAPA 4 — Buscar preço FIPE
    const priceRes = await fetch(
      `${FIPE_BASE}/${vehicleType}/brands/${brandMatch.code}/models/${modelMatch.code}/years/${yearMatch.code}`
    );
    if (!priceRes.ok) throw new Error(`Preço: ${priceRes.status}`);
    const price: FipeResult = await priceRes.json();

    const valorNumerico = parseFloat(
      price.price.replace('R$ ', '').replace(/\./g, '').replace(',', '.')
    );

    return { valorFipe: valorNumerico, codigoFipe: price.fipeCode, mesReferencia: price.referenceMonth };

  } catch (err) {
    console.error('[FIPE] Erro:', err);
    return null;
  }
};
