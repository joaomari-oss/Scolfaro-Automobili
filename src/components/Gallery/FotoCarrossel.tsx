import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FotoPlaceholder from './FotoPlaceholder';

interface FotoCarrosselProps {
  fotos: string[];
  alt?: string;
  className?: string;
}

export default function FotoCarrossel({ fotos, alt = 'Foto do veículo', className = '' }: FotoCarrosselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  if (fotos.length === 0) {
    return <FotoPlaceholder className={`w-full h-full ${className}`} />;
  }

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 360);
  };

  const handleNext = () => {
    goTo((currentIndex + 1) % fotos.length);
  };

  const handlePrev = () => {
    goTo((currentIndex - 1 + fotos.length) % fotos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <div
      className={`relative overflow-hidden w-full h-full ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Track deslizante */}
      <div
        className="flex h-full"
        style={{
          width: `${fotos.length * 100}%`,
          transform: `translateX(-${(currentIndex * 100) / fotos.length}%)`,
          transition: isAnimating ? 'transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        }}
      >
        {fotos.map((foto, i) => (
          <div
            key={i}
            style={{ width: `${100 / fotos.length}%` }}
            className="flex-shrink-0 h-full"
          >
            <img src={foto} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Setas de navegação */}
      {fotos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 hover:opacity-100 sm:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 hover:opacity-100 sm:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicadores */}
      {fotos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`Foto ${i + 1}`}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === currentIndex ? '16px' : '6px',
                height: '6px',
                backgroundColor: i === currentIndex ? '#c9a84c' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
