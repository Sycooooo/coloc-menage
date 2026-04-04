'use client'

import { useMemo } from 'react'

export default function RainOverlay({ bottomOffset = 220 }: { bottomOffset?: number }) {
  const drops = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: `${(i * 1.25) % 100 + Math.sin(i) * 3}%`,
      duration: `${0.5 + (i % 7) * 0.12}s`,
      delay: `${(i * 0.037) % 2}s`,
      opacity: 0.15 + (i % 5) * 0.08,
      height: 12 + (i % 4) * 4,
    })),
  [])

  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
      style={{ bottom: bottomOffset }}
      aria-hidden="true"
    >
      {drops.map((d) => (
        <div
          key={d.id}
          className="rain-drop"
          style={{
            left: d.left,
            animationDuration: d.duration,
            animationDelay: d.delay,
            opacity: d.opacity,
            height: d.height,
          }}
        />
      ))}
    </div>
  )
}
