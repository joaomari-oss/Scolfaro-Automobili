/**
 * C3 – QRCodeModal
 * Exibe QR Code para compartilhamento do veículo.
 */
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Share2 } from 'lucide-react';
import { showToast } from '../Layout/Toast';

interface Props {
  veiculoId: string;
  nomeVeiculo: string;
  onClose: () => void;
}

export default function QRCodeModal({ veiculoId, nomeVeiculo, onClose }: Props) {
  const url = `${window.location.origin}/veiculo/${veiculoId}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('success', 'Link copiado!');
    });
  };

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scolfaro Automobili — ${nomeVeiculo}`,
          text: `Veja o ${nomeVeiculo} na minha coleção`,
          url,
        });
      } catch {
        copiarLink();
      }
    } else {
      copiarLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div
        className="relative z-10 p-6 rounded-2xl w-full max-w-xs mx-4 animate-fade-in-up text-center"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
          Compartilhar Veículo
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{nomeVeiculo}</p>

        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-xl">
            <QRCodeSVG value={url} size={160} />
          </div>
        </div>

        <p className="font-mono text-xs px-2 py-2 rounded-lg mb-4 truncate"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          {url}
        </p>

        <div className="flex gap-2">
          <button className="sa-btn-ghost flex-1 text-sm" onClick={copiarLink}>
            <Copy className="w-4 h-4" /> Copiar link
          </button>
          <button className="sa-btn-primary flex-1 text-sm" onClick={compartilhar}>
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
