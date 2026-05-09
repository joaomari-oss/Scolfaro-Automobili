/**
 * C2 – FichaVeiculoPDF
 * Gerador de ficha PDF do veículo com @react-pdf/renderer.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Veiculo } from '../../types/veiculo';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#0A0A0A',
    color: '#F0F0F0',
    padding: 40,
    fontSize: 10,
  },
  header: {
    borderBottom: '1pt solid #F5C400',
    paddingBottom: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#F5C400',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 8,
    color: '#555555',
    letterSpacing: 3,
    marginTop: 2,
  },
  modelBlock: {
    textAlign: 'right',
  },
  modelName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  yearLabel: {
    fontSize: 9,
    color: '#888888',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#F5C400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderBottom: '0.5pt solid #2A2A2A',
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5pt solid #1A1A1A',
  },
  label: {
    color: '#888888',
    fontSize: 9,
  },
  value: {
    color: '#F0F0F0',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  valueAccent: {
    color: '#F5C400',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5pt solid #2A2A2A',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#555555',
  },
});

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtKm = (v: number) =>
  `${v.toLocaleString('pt-BR')} km`;

interface Props {
  veiculo: Veiculo;
}

export default function FichaVeiculoPDF({ veiculo }: Props) {
  const ft = veiculo.fichatecnica;
  const diff = veiculo.valorMercado - veiculo.valorFipe;
  const totalGastos = (veiculo.gastos ?? []).reduce((s, g) => s + g.valor, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SCOLFARO</Text>
            <Text style={styles.subtitle}>AUTOMOBILI</Text>
          </View>
          <View style={styles.modelBlock}>
            <Text style={styles.modelName}>{veiculo.modelo}</Text>
            <Text style={styles.yearLabel}>{veiculo.marca} · {veiculo.ano}</Text>
          </View>
        </View>

        {/* Informações gerais + Valores — 2 colunas */}
        <View style={styles.grid2}>
          {/* Coluna 1: Info geral */}
          <View style={[styles.section, styles.gridItem]}>
            <Text style={styles.sectionTitle}>Informações</Text>
            {[
              ['Placa', veiculo.placa],
              ['Cor', veiculo.cor],
              ['Tipo', veiculo.carroceria],
              ['Combustível', veiculo.combustivel],
              ['Câmbio', veiculo.cambio],
              ['Quilometragem', fmtKm(veiculo.quilometragem)],
            ].filter(([, v]) => v).map(([label, val]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{val}</Text>
              </View>
            ))}
          </View>

          {/* Coluna 2: Valores */}
          <View style={[styles.section, styles.gridItem]}>
            <Text style={styles.sectionTitle}>Valores</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Mercado</Text>
              <Text style={styles.valueAccent}>{fmt(veiculo.valorMercado)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>FIPE</Text>
              <Text style={styles.value}>{fmt(veiculo.valorFipe)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Diferença</Text>
              <Text style={[styles.value, { color: diff >= 0 ? '#22C55E' : '#EF4444' }]}>
                {diff >= 0 ? '+' : ''}{fmt(diff)}
              </Text>
            </View>
            {veiculo.codigoFipe && (
              <View style={styles.row}>
                <Text style={styles.label}>Cód. FIPE</Text>
                <Text style={styles.value}>{veiculo.codigoFipe}</Text>
              </View>
            )}
            {totalGastos > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Total Gastos</Text>
                <Text style={styles.value}>{fmt(totalGastos)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ficha Técnica */}
        {[ft.motor, ft.potencia, ft.torque].some(Boolean) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ficha Técnica</Text>
            <View style={styles.grid2}>
              <View style={styles.gridItem}>
                {[
                  ['Motor', ft.motor],
                  ['Potência', ft.potencia],
                  ['Torque', ft.torque],
                  ['Tração', ft.tracao],
                  ['Aceleração', ft.aceleracao],
                  ['Vel. Máxima', ft.velocidadeMaxima],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <View key={l} style={styles.row}>
                    <Text style={styles.label}>{l}</Text>
                    <Text style={styles.value}>{v}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.gridItem}>
                {[
                  ['Peso', ft.pesoKg ? `${ft.pesoKg} kg` : ''],
                  ['Tanque', ft.capacidadeTanque ? `${ft.capacidadeTanque} L` : ''],
                  ['Cons. Urbano', ft.consumoUrbano],
                  ['Cons. Rodovia', ft.consumoRodovia],
                  ['Dimensões', ft.dimensoes],
                  ['Passageiros', ft.capacidadePassageiros ? String(ft.capacidadePassageiros) : ''],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <View key={l} style={styles.row}>
                    <Text style={styles.label}>{l}</Text>
                    <Text style={styles.value}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Notas */}
        {veiculo.notas && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={{ fontSize: 9, color: '#AAAAAA', lineHeight: 1.4 }}>{veiculo.notas}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Scolfaro Automobili — Ficha do Veículo</Text>
          <Text style={styles.footerText}>
            Última atualização: {new Date(veiculo.ultimaAtualizacao).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
