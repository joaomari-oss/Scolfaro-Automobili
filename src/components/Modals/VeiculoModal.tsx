import { useState } from 'react';
import { X, RefreshCw, QrCode } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Veiculo, VeiculoEditavel, Gasto, Proprietario, Seguro, Tag } from '../../types/veiculo';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { showToast } from '../Layout/Toast';
import FotoCarrossel from '../Gallery/FotoCarrossel';
import EditarVeiculoForm from '../Forms/EditarVeiculoForm';
import ControleGastos from '../Gastos/ControleGastos';
import DepreciacaoChart from '../Charts/DepreciacaoChart';
import RoiCard from '../Cards/RoiCard';
import ProprietariosTimeline from '../Cards/ProprietariosTimeline';
import SeguroCard from '../Cards/SeguroCard';
import AnunciosSimilares from '../Cards/AnunciosSimilares';
import TagsVeiculo from '../Cards/TagsVeiculo';
import QRCodeModal from './QRCodeModal';
import FichaVeiculoPDF from '../PDF/FichaVeiculoPDF';

interface VeiculoModalProps {
  veiculo: Veiculo;
  theme: 'dark' | 'light';
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Veiculo>) => Promise<Veiculo>;
  onAtualizarValores: (id: string) => Promise<{ erros: string[]; iaUsada?: 'gemini' | 'groq' }>;
  onAdicionarGasto: (veiculoId: string, gasto: Omit<Gasto, 'id' | 'createdAt'>) => void;
  onEditarGasto: (veiculoId: string, gastoId: string, dados: Omit<Gasto, 'id' | 'createdAt'>) => void;
  onRemoverGasto: (veiculoId: string, gastoId: string) => void;
}

type AbaModal = 'ficha' | 'valorizacao' | 'depreciacao' | 'roi' | 'proprietarios' | 'seguro' | 'anuncios' | 'editar' | 'gastos';

export default function VeiculoModal({
  veiculo,
  theme,
  onClose,
  onUpdate,
  onAtualizarValores,
  onAdicionarGasto,
  onEditarGasto,
  onRemoverGasto,
}: VeiculoModalProps) {
  const isDark = theme === 'dark';
  const [abaAtiva, setAbaAtiva] = useState<AbaModal>('ficha');
  const [loading, setLoading] = useState(false);
  const [ultimaIAUsada, setUltimaIAUsada] = useState<'gemini' | 'groq' | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const handleAtualizar = async () => {
    setLoading(true);
    try {
      const result = await onAtualizarValores(veiculo.id);
      if (result.iaUsada) setUltimaIAUsada(result.iaUsada);
      if (result.erros.length > 0 && !result.iaUsada) {
        showToast('error', result.erros[0]);
      } else {
        showToast('success', `Valores de ${veiculo.modelo} atualizados!`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEdicao = async (id: string, dados: VeiculoEditavel) => {
    const hoje = new Date().toISOString().split('T')[0];
    try {
      await onUpdate(id, { ...dados, ultimaAtualizacao: hoje });
      showToast('success', 'Veículo atualizado com sucesso');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast('error', `Erro ao salvar: ${msg}`);
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

  const abas: { key: AbaModal; label: string }[] = [
    { key: 'ficha',         label: 'Ficha' },
    { key: 'valorizacao',   label: 'Histórico' },
    { key: 'depreciacao',   label: 'Depreciação' },
    { key: 'roi',           label: 'ROI' },
    { key: 'proprietarios', label: 'Proprietários' },
    { key: 'seguro',        label: 'Seguro' },
    { key: 'anuncios',      label: 'Anúncios' },
    { key: 'editar',        label: '✏️ Editar' },
    { key: 'gastos',        label: '💰 Gastos' },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-start justify-center sm:overflow-y-auto sm:py-8 sm:px-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div
        className="sa-modal relative w-full max-w-3xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '95dvh', overflowY: 'auto' }}
      >
        {/* QR Code Modal */}
        {qrOpen && (
          <QRCodeModal
            veiculoId={veiculo.id}
            nomeVeiculo={`${veiculo.marca} ${veiculo.modelo}`}
            onClose={() => setQrOpen(false)}
          />
        )}

        {/* Top-right buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setQrOpen(true)}
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            title="Gerar QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <PDFDownloadLink
            document={<FichaVeiculoPDF veiculo={veiculo} />}
            fileName={`${veiculo.marca}_${veiculo.modelo}_${veiculo.ano}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button
                className="p-2 rounded-xl text-xs font-medium"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                title="Baixar PDF"
                disabled={pdfLoading}
              >
                {pdfLoading ? '…' : 'PDF'}
              </button>
            )}
          </PDFDownloadLink>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery */}
        <div
          className="relative rounded-t-2xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          <FotoCarrossel fotos={veiculo.fotos} alt={veiculo.modelo} className="rounded-t-2xl" />

          {veiculo.fotos.length > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 p-5 pointer-events-none"
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
          )}
        </div>

        {/* Header info when no photos */}
        {veiculo.fotos.length === 0 && (
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="sa-label text-[11px] uppercase tracking-widest mb-1">{veiculo.marca}</p>
                <h2 className="font-display font-extrabold text-2xl leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {veiculo.modelo}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{veiculo.ano}</p>
              </div>
              <span className="font-data text-xs px-2 py-1 rounded mt-1" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                {veiculo.placa}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Meta info row */}
          <div className="space-y-2">
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
            {(veiculo.tags ?? []).length > 0 && (
              <TagsVeiculo
                tags={veiculo.tags ?? []}
                onChange={(tags: Tag[]) => onUpdate(veiculo.id, { tags })}
                readOnly={false}
              />
            )}
          </div>

          {/* Values row */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl"
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
              {veiculo.codigoFipe && (
                <p className="font-data text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {veiculo.codigoFipe}
                </p>
              )}
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

          {/* Update button + IA badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAtualizar}
              disabled={loading}
              className="sa-btn-ghost"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar valores via IA'}
            </button>
            {ultimaIAUsada && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                ultimaIAUsada === 'gemini'
                  ? 'bg-blue-900/40 text-blue-300 border border-blue-700'
                  : 'bg-orange-900/40 text-orange-300 border border-orange-700'
              }`}>
                {ultimaIAUsada === 'gemini' ? '🔵 Gemini 2.5 Flash' : '🟠 Groq compound-beta'}
              </span>
            )}
          </div>

          {/* ── ABAS INTERNAS ─────────────────────────────────── */}
          <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
            {abas.map(aba => (
              <button
                key={aba.key}
                onClick={() => setAbaAtiva(aba.key)}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap"
                style={
                  abaAtiva === aba.key
                    ? { borderColor: '#c9a84c', color: '#c9a84c' }
                    : { borderColor: 'transparent', color: 'var(--text-muted)' }
                }
              >
                {aba.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba */}
          <div>
            {abaAtiva === 'ficha' && (
              <div>
                {fichaTecnicaRows.length > 0 ? (
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
                ) : (
                  <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Nenhuma ficha técnica cadastrada.
                  </p>
                )}
                {veiculo.notas && (
                  <div
                    className="p-4 rounded-xl mt-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
                  >
                    <h3 className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Notas</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{veiculo.notas}</p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'valorizacao' && (
              <div>
                {chartData.length > 1 ? (
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
                ) : (
                  <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Histórico insuficiente para exibir o gráfico (mín. 2 pontos).
                  </p>
                )}
              </div>
            )}

            {abaAtiva === 'editar' && (
              <EditarVeiculoForm
                veiculo={veiculo}
                onSalvar={(dados) => handleSalvarEdicao(veiculo.id, dados)}
                onCancelar={() => setAbaAtiva('ficha')}
              />
            )}

            {abaAtiva === 'gastos' && (
              <ControleGastos
                veiculo={veiculo}
                onAdicionarGasto={(gasto) => onAdicionarGasto(veiculo.id, gasto)}
                onEditarGasto={(gastoId, dados) => onEditarGasto(veiculo.id, gastoId, dados)}
                onRemoverGasto={(gastoId) => onRemoverGasto(veiculo.id, gastoId)}
              />
            )}

            {abaAtiva === 'depreciacao' && (
              <DepreciacaoChart veiculo={veiculo} theme={theme} />
            )}

            {abaAtiva === 'roi' && (
              <RoiCard
                veiculo={veiculo}
                onUpdate={(dados) => onUpdate(veiculo.id, dados)}
              />
            )}

            {abaAtiva === 'proprietarios' && (
              <ProprietariosTimeline
                proprietarios={veiculo.proprietarios ?? []}
                onChange={(lista: Proprietario[]) => onUpdate(veiculo.id, { proprietarios: lista })}
              />
            )}

            {abaAtiva === 'seguro' && (
              <SeguroCard
                seguro={veiculo.seguro}
                onChange={(seguro: Seguro | undefined) => onUpdate(veiculo.id, { seguro })}
              />
            )}

            {abaAtiva === 'anuncios' && (
              <AnunciosSimilares veiculo={veiculo} />
            )}
          </div>

          {/* Last update */}
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Última atualização: {formatDate(veiculo.ultimaAtualizacao)}
          </p>
        </div>
      </div>
    </div>
  );
}
