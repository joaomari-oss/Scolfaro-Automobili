import type { Veiculo } from '../types/veiculo';
import { formatCurrency, formatKm, formatDate } from './formatters';

export function exportarCSV(veiculos: Veiculo[], nomeArquivo = 'scolfaro_acervo.csv'): void {
  const cabecalho = [
    'Modelo', 'Marca', 'Ano', 'Placa', 'Quilometragem', 'Tipo', 'Cor',
    'Combustível', 'Câmbio', 'Valor Mercado', 'Valor FIPE', 'Diferença',
    'Última Atualização', 'Favorito', 'Total Gastos',
  ].join(';');

  const linhas = veiculos.map(v => {
    const totalGastos = (v.gastos ?? []).reduce((s, g) => s + g.valor, 0);
    const diff = v.valorMercado - v.valorFipe;
    return [
      `"${v.modelo}"`,
      `"${v.marca}"`,
      v.ano,
      `"${v.placa}"`,
      formatKm(v.quilometragem),
      `"${v.carroceria}"`,
      `"${v.cor}"`,
      `"${v.combustivel}"`,
      `"${v.cambio}"`,
      formatCurrency(v.valorMercado),
      formatCurrency(v.valorFipe),
      formatCurrency(diff),
      formatDate(v.ultimaAtualizacao),
      v.favorito ? 'Sim' : 'Não',
      formatCurrency(totalGastos),
    ].join(';');
  });

  // BOM para Excel UTF-8
  const conteudo = '\uFEFF' + [cabecalho, ...linhas].join('\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
