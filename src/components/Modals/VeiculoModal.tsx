import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, RefreshCw, Car } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { useIA } from '../../hooks/useIA';
import { showToast } from '../Layout/Toast';

interface VeiculoModalProps {
  veiculo: Veiculo;
  theme: 'dark' | 'light';
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Veiculo>) => void;
}

export default function VeiculoModal({ veiculo, theme, onClose, onUpdate }: VeiculoModalProps) {
  const isDark = theme === 'dark';
  const { buscarValores, loading } = useIA();
  const [fotoIndex, setFotoIndex] = useState(0);

  const handleAtualizar = async () => {
    try {
      const result = await buscarValores({
        modelo: veiculo.modelo,
        marca: veiculo.marca,
        ano: veiculo.ano,
        quilometragem: veiculo.quilometragem,
        combustivel: veiculo.combustivel,
      });
      if (result) {
        const hoje = new Date().toISOString().split('T')[0];
        onUpdate(veiculo.id, {
          valorMercado: result.valorMercado,
          valorFipe: result.valorFipe,
          ultimaAtualizacao: hoje,
          historicovalorizacao: [
            ...veiculo.historicovalorizacao,
            { data: hoje, valorMercado: result.valorMercado, valorFipe: result.valorFipe, fonte: 'IA Scolfaro' },
          ],
        });
        showToast('success', `Valores de ${veiculo.modelo} atualizados!`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', message);
    }
  };

  const fichaTecnicaRows = [
    ['Motor', veiculo.fichatecnica.motor],
    ['Potência', veiculo.fichatecnica.potencia],
    ['Torque', veiculo.fichatecnica.torque],
    ['Tração', veiculo.fichatecnica.tracao],
    ['Aceleração', veiculo.fichatecnica.aceleracao],
    ['Vel. Máxima', veiculo.fichatecnica.velocidadeMaxima],
    ['Peso', veiculo.fichatecnica.pesoKg ? `${veiculo.fichatecnica.pesoKg.toLocaleString('pt-BR')} kg` : ''],
    ['Tanque', veiculo.fichatecnica.capacidadeTanque ? `${veiculo.fichatecnica.capacidadeTanque} L` : ''],
    ['Consumo Urbano', veiculo.fichatecnica.consumoUrbano],
    ['Consumo Rodovia', veiculo.fichatecnica.consumoRodovia],
    ['Dimensões', veiculo.fichatecnica.dimensoes],
    ['Passageiros', veiculo.fichatecnica.capacidadePassageiros ? String(veiculo.fichatecnica.capacidadePassageiros) : ''],
    ['Outros', veiculo.fichatecnica.outros || ''],
  ].filter(([, val]) => val);

  const chartData = veiculo.historicovalorizacao.map(h => ({
    data: formatDate(h.data),
    Mercado: h.valorMercado,
    FIPE: h.valorFipe,
  }));

  const tickColor = isDark ? '#5A5A5A' : '#A3A3A3';
  const accentColor = isDark ? '#F5C400' : '#1D4ED8';

  const diff = veiculo.valorMercado - veiculo.valorFipe;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto py-8 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div
        className="sa-modal relative w-full max-w-3xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery */}
        <div
          className="relative rounded-t-2xl overflow-hidden"
          style={{ aspectRatio: '16/9', backgroundColor: 'var(--bg-tertiary)' }}
        >
          {veiculo.fotos.length > 0 ? (
            <>
              <img src={veiculo.fotos[fotoIndex]} alt={veiculo.modelo} className="w-full h-full object-cover" />
              {veiculo.fotos.length > 1 && (
                <>
                  <button
                    onClick={() => setFotoIndex(i => (i - 1 + veiculo.fotos.length) % veiculo.fotos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setFotoIndex(i => (i + 1) % veiculo.fotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {veiculo.fotos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFotoIndex(i)}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: i === fotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-20 h-20" style={{ color: 'var(--border-primary)' }} />
            </div>
          )}

          {/* Overlay info on image */}
          <div
            className="absolute inset-x-0 bottom-0 p-5"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 text-xs mb-1 font-display tracking-widest">{veiculo.marca.toUpperCase()}</p>
                <h2 className="font-display font-extrabold text-2xl text-white leading-tight">{veiculo.modelo}</h2>
                <p className="text-white/60 text-sm mt-0.5">{veiculo.ano}</p>
              </div>
              <span
                className="font-data text-xs px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}
              >
                {veiculo.placa}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Meta info row */}
          <div className="flex flex-wrap gap-2">
            {[
              veiculo.cor,
              veiculo.combustivel,
              veiculo.cambio,
              veiculo.carroceria,
              formatKm(veiculo.quilometragem),
            ].filter(Boolean).map(tag => (
              <span key={tag} className="sa-badge">{tag}</span>
            ))}
          </div>

          {/* Values row */}
          <div
            className="grid grid-cols-3 gap-4 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <div>
              <p className="sa-label text-[10px] uppercase tracking-widest mb-1">Mercado</p>
              <p className="font-data font-medium text-xl" style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(veiculo.valorMercado)}
              </p>
            </div>
            <div>
              <p className="sa-label text-[10px] uppercase tracking-widest mb-1">FIPE</p>
              <p className="font-data font-medium text-xl" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(veiculo.valorFipe)}
              </p>
            </div>
            <div>
              <p className="sa-label text-[10px] uppercase tracking-widest mb-1">Diferença</p>
              <p
                className="font-data font-medium text-xl"
                style={{ color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
              </p>
            </div>
          </div>

          {/* Update button */}
          <button
            onClick={handleAtualizar}
            disabled={loading}
            className="sa-btn-ghost"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando via IA...' : 'Atualizar valores via IA'}
          </button>

          {/* Chart */}
          {chartData.length > 1 && (
            <div>
              <h3 className="font-display font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                Histórico de Valorização
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient id="mercadoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="data" tick={{ fontSize: 11, fill: tickColor }} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                        borderColor: isDark ? '#2A2A2A' : '#E4E4E7',
                        borderRadius: '10px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: isDark ? '#F0F0F0' : '#0F0F0F',
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans, sans-serif' }} />
                    <Area type="monotone" dataKey="Mercado" stroke={accentColor} strokeWidth={2} fill="url(#mercadoGrad)" dot={{ r: 3, fill: accentColor }} />
                    <Area type="monotone" dataKey="FIPE" stroke={isDark ? '#3B82F6' : '#2563EB'} strokeWidth={2} fill="transparent" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Ficha Técnica */}
          {fichaTecnicaRows.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                Ficha Técnica
              </h3>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {fichaTecnicaRows.map(([label, value], i) => (
                    <div
                      key={label}
                      className="flex justify-between items-center px-4 py-2.5"
                      style={{
                        backgroundColor: i % 2 === 0 ? 'var(--bg-tertiary)' : 'transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
                      <span className="text-xs font-medium text-right" style={{ color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {veiculo.notas && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
            >
              <h3 className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Notas</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{veiculo.notas}</p>
            </div>
          )}

          {/* Last update */}
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Última atualização: {formatDate(veiculo.ultimaAtualizacao)}
          </p>
        </div>
      </div>
    </div>
  );
}
