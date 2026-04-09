export const FotoPlaceholder = ({ className }: { className?: string }) => (
  <div
    className={`flex flex-col items-center justify-center ${className ?? ''}`}
    style={{ backgroundColor: 'var(--bg-tertiary)' }}
  >
    <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ maxHeight: '100%' }}>
      {/* Corpo principal do carro (silhueta sólida preta) */}
      <path
        d="M 60 140
           L 60 115
           Q 62 100 80 92
           L 130 78
           Q 155 58 190 55
           L 240 55
           Q 275 58 295 72
           L 330 90
           Q 348 95 352 115
           L 352 140 Z"
        fill="#0d0d0d"
        stroke="#c9a84c"
        strokeWidth="2.5"
      />

      {/* Para-brisa dianteiro */}
      <path
        d="M 280 72 L 295 72 L 330 90 L 305 90 Z"
        fill="#0d0d0d"
        stroke="#c9a84c"
        strokeWidth="1.8"
      />

      {/* Janela lateral traseira */}
      <path
        d="M 155 65 L 210 60 L 210 88 L 155 92 Z"
        fill="#0d0d0d"
        stroke="#c9a84c"
        strokeWidth="1.8"
      />

      {/* Janela lateral dianteira */}
      <path
        d="M 215 60 L 270 60 L 278 88 L 215 88 Z"
        fill="#0d0d0d"
        stroke="#c9a84c"
        strokeWidth="1.8"
      />

      {/* Roda traseira */}
      <circle cx="130" cy="143" r="24" fill="#111" stroke="#c9a84c" strokeWidth="2.5" />
      <circle cx="130" cy="143" r="14" fill="#0d0d0d" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="130" cy="143" r="5" fill="#c9a84c" />
      <line x1="130" y1="129" x2="130" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="130" y1="143" x2="130" y2="157" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="116" y1="143" x2="130" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="130" y1="143" x2="144" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="120" y1="133" x2="130" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="130" y1="143" x2="140" y2="153" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="140" y1="133" x2="130" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="130" y1="143" x2="120" y2="153" stroke="#c9a84c" strokeWidth="1.2" />

      {/* Roda dianteira */}
      <circle cx="300" cy="143" r="24" fill="#111" stroke="#c9a84c" strokeWidth="2.5" />
      <circle cx="300" cy="143" r="14" fill="#0d0d0d" stroke="#c9a84c" strokeWidth="1.5" />
      <circle cx="300" cy="143" r="5" fill="#c9a84c" />
      <line x1="300" y1="129" x2="300" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="300" y1="143" x2="300" y2="157" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="286" y1="143" x2="300" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="300" y1="143" x2="314" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="290" y1="133" x2="300" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="300" y1="143" x2="310" y2="153" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="310" y1="133" x2="300" y2="143" stroke="#c9a84c" strokeWidth="1.2" />
      <line x1="300" y1="143" x2="290" y2="153" stroke="#c9a84c" strokeWidth="1.2" />

      {/* Farol dianteiro */}
      <ellipse cx="348" cy="118" rx="6" ry="4" fill="#c9a84c" opacity="0.8" />

      {/* Lanterna traseira */}
      <rect x="60" y="110" width="5" height="12" rx="1" fill="#c9a84c" opacity="0.8" />

      {/* Linha inferior do carro (soleira) */}
      <line x1="84" y1="140" x2="106" y2="140" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="154" y1="140" x2="276" y2="140" stroke="#c9a84c" strokeWidth="1.5" />
      <line x1="324" y1="140" x2="352" y2="140" stroke="#c9a84c" strokeWidth="1.5" />

      {/* Texto */}
      <text
        x="200"
        y="185"
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="11"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Sem fotos cadastradas
      </text>
    </svg>
  </div>
);

export default FotoPlaceholder;
