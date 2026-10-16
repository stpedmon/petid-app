'use client'

/**
 * Loader de marca: la placa circular de PetID dibujándose, con los puntos
 * del QR encendiéndose en onda. Reemplaza la huellita rebotando.
 */
export default function PetIDLoader({
  size = 72,
  color = '#FF6B6B',
  accent = '#FFC857',
  label,
  labelColor,
}: {
  size?: number
  color?: string
  accent?: string
  label?: string
  labelColor?: string
}) {
  // 3x3 QR cells, ripple from the center outward
  const cells = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
  ]
  const delay = (x: number, y: number) => (Math.abs(x - 1) + Math.abs(y - 1)) * 0.14
  const r = 44 // ring radius in a 100x100 box
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite" aria-label={label || 'Cargando'}>
      <svg width={size} height={size * 1.12} viewBox="0 -12 100 112" fill="none" aria-hidden="true">
        <style>{`
          @keyframes petid-ring { 0% { stroke-dashoffset: ${circ}; transform: rotate(-90deg) } 55% { stroke-dashoffset: 0; transform: rotate(-90deg) } 100% { stroke-dashoffset: -${circ}; transform: rotate(-90deg) } }
          @keyframes petid-cell { 0%, 60%, 100% { opacity: .18; transform: scale(.7) } 25% { opacity: 1; transform: scale(1) } }
          @keyframes petid-loop { 0%, 100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
          .petid-ring { stroke-dasharray: ${circ}; animation: petid-ring 1.9s cubic-bezier(.65,0,.35,1) infinite; transform-origin: 50px 50px; }
          .petid-cell { animation: petid-cell 1.9s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          .petid-loop { animation: petid-loop 1.9s ease-in-out infinite; transform-origin: 50px 44px; }
          @media (prefers-reduced-motion: reduce) { .petid-ring, .petid-cell, .petid-loop { animation: none } .petid-ring { stroke-dashoffset: 0 } .petid-cell { opacity: 1; transform: none } }
        `}</style>
        <g className="petid-loop">
          {/* argolla de la placa */}
          <circle cx="50" cy="-2" r="6" stroke={color} strokeWidth="4" opacity=".9" />
          {/* placa */}
          <circle cx="50" cy="50" r={r} stroke={`${color}22`} strokeWidth="5" />
          <circle className="petid-ring" cx="50" cy="50" r={r} stroke={color} strokeWidth="5" strokeLinecap="round" />
          {/* QR */}
          {cells.map(([x, y], i) => {
            const isCorner = (x !== 1 && y !== 1)
            return (
              <rect
                key={i}
                className="petid-cell"
                x={32 + x * 13.5}
                y={32 + y * 13.5}
                width="9"
                height="9"
                rx="2.4"
                fill={isCorner ? color : accent}
                style={{ animationDelay: `${delay(x, y)}s` }}
              />
            )
          })}
        </g>
      </svg>
      {label && (
        <p className="text-sm font-medium" style={{ color: labelColor || `${color}B3` }}>{label}</p>
      )}
    </div>
  )
}
