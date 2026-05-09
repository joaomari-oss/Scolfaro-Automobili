/**
 * A3 – RoiCard
 * Exibe ROI e rentabilidade do veículo com base em preço de compra vs. mercado.
 */
import { useState } from 'react';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  veiculo: Veiculo;
  onUpdate?: (dados: { precoCompra?: number; dataCompra?: string; precoVenda?: number; dataVenda?: string }) => void;
}

export default function RoiCard({ veiculo, onUpdate }: Props) {
  const [precoCompra, setPrecoCompra] = useState<number | ''>(veiculo.precoCompra ?? '');
  const [dataCompra, setDataCompra] = useState(veiculo.dataCompra ?? '');
  const [editando, setEditando] = useState(!veiculo.precoCompra);

  const handleSalvar = () => {
    if (!precoCompra) return;
    onUpdate?.({ precoCompra: Number(precoCompra), dataCompra });
    setEditando(false);
  };

  const custoTotal = (veiculo.gastos ?? []).reduce((s, g) => s + g.valor, 0);
  const investimentoTotal = (precoCompra ? Number(precoCompra) : 0) + custoTotal;
  const valorAtual = veiculo.valorMercado;
  const lucro = valorAtual - investimentoTotal;
  const roi = investimentoTotal > 0 ? (lucro / investimentoTotal) * 100 : null;

  // Período em meses
  let meses = 0;
  if (dataCompra) {
    const inicio = new Date(dataCompra);
    const agora = new Date();
    meses = (agora.getFullYear() - inicio.getFullYear()) * 12 + (agora.getMonth() - inicio.getMonth());
  }
  const roiMensal = roi !== null && meses > 0 ? roi / meses : null;

  if (editando) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Informe o preço de compra para calcular o ROI da sua coleção.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="sa-label text-xs block mb-1">Preço de Compra (R$)</label>
            <input
              type="number"
              value={precoCompra}
              onChange={e => setPrecoCompra(e.target.value ? Number(e.target.value) : '')}
              className="sa-input w-full font-data"
              placeholder="Ex: 1800000"
            />
          </div>
          <div>
            <label className="sa-label text-xs block mb-1">Data de Compra</label>
            <input
              type="date"
              value={dataCompra}
              onChange={e => setDataCompra(e.target.value)}
              className="sa-input w-full"
            />
          </div>
        </div>
        <button className="sa-btn-primary" onClick={handleSalvar} disabled={!precoCompra}>
          Calcular ROI
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Preço de Compra',
            valor: formatCurrency(Number(precoCompra)),
            cor: 'var(--text-primary)',
          },
          {
            label: 'Total em Gastos',
            valor: formatCurrency(custoTotal),
            cor: 'var(--color-warning)',
          },
          {
            label: 'Investimento Total',
            valor: formatCurrency(investimentoTotal),
            cor: 'var(--text-primary)',
          },
          {
            label: 'Valor Atual',
            valor: formatCurrency(valorAtual),
            cor: 'var(--accent-primary)',
          },
        ].map(item => (
          <div
            key={item.label}
            className="p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              {item.label}
            </p>
            <p className="font-data font-semibold text-base" style={{ color: item.cor }}>
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      {roi !== null && (
        <div
          className="p-4 rounded-xl text-center"
          style={{
            backgroundColor: lucro >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${lucro >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          <p className="sa-label text-xs mb-1">ROI Total</p>
          <p
            className="font-data font-bold text-3xl"
            style={{ color: lucro >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {lucro >= 0 ? '+' : ''}{roi.toFixed(2)}%
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {lucro >= 0 ? 'Lucro' : 'Prejuízo'}: {formatCurrency(Math.abs(lucro))}
            {meses > 0 && ` · ${meses} meses`}
          </p>
          {roiMensal !== null && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {roiMensal.toFixed(3)}% ao mês
            </p>
          )}
        </div>
      )}

      <button
        className="sa-btn-ghost text-sm"
        onClick={() => setEditando(true)}
      >
        ✏️ Editar dados de compra
      </button>
    </div>
  );
}
