'use client'
import { useMemo } from 'react'

/**
 * Fondo de la pantalla de acceso: un campo de celdas tipo QR que respira en
 * ondas, atravesado por un haz de escaneo muy lento. Sustituye las huellas.
 */
export default function IdentityField({
  colors = ['#FF6B6B', '#FFC857', '#BEE3F8'],
  density = 0.14,
  cols = 11,
  rows = 26,
}: {
  colors?: string[]
  density?: number
  cols?: number
  rows?: number
}) {
  const cells = useMemo(() => {
    // generador determinista para que el patrón no cambie entre renders
    let seed = 20261015
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
    const out: { x: number; y: number; c: string; d: number; s: number; big: boolean }[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = rnd()
        if (v > density) continue
        out.push({
          x, y,
          c: colors[Math.floor(rnd() * colors.length)],
          d: (x + y) * 0.18 + rnd() * 0.6,   // onda diagonal
          s: 0.55 + rnd() * 0.45,
          big: rnd() < 0.06,
        })
      }
    }
    return out
  }, [colors, density, cols, rows])

  const U = 10 // unidades por celda (celdas cuadradas)
  const cw = U
  const ch = U

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes petid-cell-breathe { 0%, 100% { opacity: .04; transform: scale(.7) } 50% { opacity: .2; transform: scale(1) } }
        @keyframes petid-scan { 0% { transform: translateY(-30%) } 100% { transform: translateY(130%) } }
        @keyframes petid-drift { 0%, 100% { transform: translate(0, 0) } 50% { transform: translate(-1.5%, 1%) } }
        .petid-field { animation: petid-drift 22s ease-in-out infinite; }
        .petid-field-cell { animation: petid-cell-breathe 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .petid-scan { animation: petid-scan 14s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .petid-field, .petid-field-cell, .petid-scan { animation: none } .petid-field-cell { opacity: .16 } }
      `}</style>
      <svg className="petid-field absolute inset-0 w-full h-full" viewBox={`0 0 ${cols * U} ${rows * U}`} preserveAspectRatio="xMidYMid slice">
        {cells.map((c, i) => {
          const w = cw * (c.big ? 1.3 : 0.6) * c.s
          const h = w
          return (
            <rect
              key={i}
              className="petid-field-cell"
              x={c.x * cw + (cw - w) / 2}
              y={c.y * ch + (ch - h) / 2}
              width={w}
              height={h}
              rx={w * 0.3}
              fill={c.c}
              style={{ animationDelay: `-${c.d}s` }}
            />
          )
        })}
      </svg>
      {/* haz de escaneo */}
      <div
        className="petid-scan absolute left-0 right-0"
        style={{
          top: 0,
          height: '26%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,107,107,0.07) 45%, rgba(255,107,107,0.11) 50%, rgba(255,107,107,0.07) 55%, transparent 100%)',
        }}
      />
    </div>
  )
}
