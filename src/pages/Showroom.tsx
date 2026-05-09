/**
 * C1 – Showroom
 * Modo galeria em tela cheia para apresentação da coleção.
 */
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Veiculo } from '../types/veiculo';
import { formatCurrency, formatKm } from '../utils/formatters';
import FotoPlaceholder from '../components/Gallery/FotoPlaceholder';

interface Props {
  veiculos: Veiculo[];
}

export default function Showroom({ veiculos }: Props) {
  const navigate = useNavigate();
  const [indice, setIndice] = useState(0);
  const [fotoIdx, setFotoIdx] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  const veiculo = veiculos[indice] ?? null;

  const proximo = useCallback(() => {
    setIndice(i => (i + 1) % veiculos.length);
    setFotoIdx(0);
  }, [veiculos.length]);

  const anterior = useCallback(() => {
    setIndice(i => (i - 1 + veiculos.length) % veiculos.length);
    setFotoIdx(0);
  }, [veiculos.length]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || veiculos.length <= 1) return;
    const t = setTimeout(proximo, 6000);
    return () => clearTimeout(t);
  }, [autoPlay, indice, proximo, veiculos.length]);

  // Teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') proximo();
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'Escape') navigate(-1);
      if (e.key === 'i') setShowInfo(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [proximo, anterior, navigate]);

  if (veiculos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-xl font-display font-bold mb-4">Nenhum veículo no acervo</p>
          <button onClick={() => navigate(-1)} className="sa-btn-ghost">Voltar</button>
        </div>
      </div>
    );
  }

  const fotos = veiculo.fotos.length > 0 ? veiculo.fotos : [];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Foto principal */}
      <div className="flex-1 relative overflow-hidden cursor-pointer" onClick={() => setAutoPlay(v => !v)}>
        {fotos.length > 0 ? (
          <img
            key={`${indice}-${fotoIdx}`}
            src={fotos[fotoIdx]}
            alt={veiculo.modelo}
            className="w-full h-full object-cover animate-fade-in"
            style={{ transition: 'opacity 0.5s ease' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900">
            <FotoPlaceholder className="photo-placeholder w-64 h-48" />
          </div>
        )}

        {/* Overlay gradiente */}
        <div className="showroom-overlay absolute inset-0 pointer-events-none" />

        {/* Info do veículo */}
        {showInfo && (
          <div
            className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 animate-fade-in-up"
          >
            <p className="font-display font-medium text-white/60 text-sm mb-1 tracking-widest uppercase">
              {veiculo.marca}
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight mb-2">
              {veiculo.modelo}
            </h2>
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <span className="font-data text-white/60 text-sm">{veiculo.ano}</span>
              <span className="font-data text-white/60 text-sm">{formatKm(veiculo.quilometragem)}</span>
              <span className="font-data text-white/60 text-sm">{veiculo.cor}</span>
              <span className="font-data font-bold text-lg" style={{ color: '#F5C400' }}>
                {formatCurrency(veiculo.valorMercado)}
              </span>
            </div>
            {veiculo.fichatecnica.potencia && (
              <p className="font-data text-white/50 text-xs">
                {veiculo.fichatecnica.motor && `${veiculo.fichatecnica.motor} · `}
                {veiculo.fichatecnica.potencia}
                {veiculo.fichatecnica.aceleracao && ` · 0–100: ${veiculo.fichatecnica.aceleracao}`}
              </p>
            )}
          </div>
        )}

        {/* Miniaturas de foto */}
        {fotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setFotoIdx(i); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i === fotoIdx ? '#F5C400' : 'rgba(255,255,255,0.4)',
                  transform: i === fotoIdx ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button
          onClick={() => setShowInfo(v => !v)}
          className="p-2 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)' }}
          title="Mostrar/ocultar info (i)"
        >
          <Info className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(8px)' }}
          title="Fechar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={anterior}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-20"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(8px)' }}
        title="Anterior (←)"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={proximo}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-20"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(8px)' }}
        title="Próximo (→)"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Barra de progresso / indicador */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((indice + 1) / veiculos.length) * 100}%`,
            backgroundColor: '#F5C400',
          }}
        />
      </div>

      {/* Miniaturas de veículos (bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 overflow-x-auto scrollbar-hide"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        {veiculos.map((v, i) => (
          <button
            key={v.id}
            onClick={() => { setIndice(i); setFotoIdx(0); setAutoPlay(false); }}
            className="shrink-0 rounded-lg overflow-hidden border-2 transition-all"
            style={{
              width: 60,
              height: 40,
              borderColor: i === indice ? '#F5C400' : 'transparent',
            }}
          >
            {v.fotos.length > 0 ? (
              <img src={v.fotos[0]} alt={v.modelo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <span className="text-white/40 text-[10px]">{v.marca.slice(0, 2)}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Auto-play badge */}
      <div className="absolute top-4 left-4 z-20">
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: autoPlay ? '#F5C400' : 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {indice + 1}/{veiculos.length} {autoPlay ? '· Auto' : ''}
        </span>
      </div>
    </div>
  );
}
