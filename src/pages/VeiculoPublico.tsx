/**
 * E2 – VeiculoPublico
 * Página pública de um veículo específico (sem dados financeiros).
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Copy } from 'lucide-react';
import type { Veiculo } from '../types/veiculo';
import { formatKm } from '../utils/formatters';
import FotoCarrossel from '../components/Gallery/FotoCarrossel';
import TagsVeiculo from '../components/Cards/TagsVeiculo';
import { showToast } from '../components/Layout/Toast';

interface Props {
  veiculos: Veiculo[];
}

export default function VeiculoPublico({ veiculos }: Props) {
  const { id } = useParams<{ id: string }>();
  const veiculo = veiculos.find(v => v.id === id);

  const compartilhar = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${veiculo?.marca} ${veiculo?.modelo}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('success', 'Link copiado!'));
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('success', 'Link copiado!'));
  };

  if (!veiculo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center page-transition">
        <p className="text-4xl mb-4">🚗</p>
        <h1 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Veículo não encontrado
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Este veículo pode ter sido removido da coleção.
        </p>
        <Link to="/publico" className="sa-btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Ver coleção
        </Link>
      </div>
    );
  }

  const ft = veiculo.fichatecnica;
  const fichaTecnicaRows = [
    ['Motor', ft.motor],
    ['Potência', ft.potencia],
    ['Torque', ft.torque],
    ['Tração', ft.tracao],
    ['Aceleração 0–100', ft.aceleracao],
    ['Vel. Máxima', ft.velocidadeMaxima],
    ['Peso', ft.pesoKg ? `${ft.pesoKg.toLocaleString('pt-BR')} kg` : ''],
    ['Tanque', ft.capacidadeTanque ? `${ft.capacidadeTanque} L` : ''],
    ['Cons. Urbano', ft.consumoUrbano],
    ['Cons. Rodovia', ft.consumoRodovia],
    ['Dimensões', ft.dimensoes],
    ['Passageiros', ft.capacidadePassageiros ? String(ft.capacidadePassageiros) : ''],
    ['Outros', ft.outros ?? ''],
  ].filter(([, v]) => v);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 page-transition">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link to="/publico" className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Coleção
        </Link>
        <div className="flex gap-2">
          <button onClick={copiarLink} className="sa-btn-ghost text-sm py-1.5">
            <Copy className="w-4 h-4" /> Copiar link
          </button>
          <button onClick={compartilhar} className="sa-btn-primary text-sm py-1.5">
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
        </div>
      </div>

      {/* Galeria */}
      <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <FotoCarrossel fotos={veiculo.fotos} alt={veiculo.modelo} className="w-full h-full" />
      </div>

      {/* Título */}
      <div>
        <p className="sa-label text-xs uppercase tracking-widest mb-1">{veiculo.marca}</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          {veiculo.modelo}
        </h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {[veiculo.cor, veiculo.combustivel, veiculo.cambio, veiculo.carroceria, formatKm(veiculo.quilometragem)].filter(Boolean).map(tag => (
            <span key={tag} className="sa-badge">{tag}</span>
          ))}
        </div>
        {(veiculo.tags ?? []).length > 0 && (
          <div className="mt-3">
            <TagsVeiculo tags={veiculo.tags ?? []} onChange={() => {}} readOnly />
          </div>
        )}
      </div>

      {/* Ficha técnica */}
      {fichaTecnicaRows.length > 0 && (
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
            <h2 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ficha Técnica</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {fichaTecnicaRows.map(([label, value], i) => (
              <div
                key={label}
                className="flex justify-between items-center px-4 py-3 border-b"
                style={{
                  backgroundColor: i % 2 === 0 ? 'var(--bg-tertiary)' : 'transparent',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-xs font-medium font-data text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="text-center pt-4">
        <p className="font-display font-bold tracking-widest text-xl mb-1" style={{ color: 'var(--accent-primary)' }}>SCOLFARO</p>
        <p className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>AUTOMOBILI</p>
      </div>
    </div>
  );
}
