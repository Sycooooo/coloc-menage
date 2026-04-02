'use client'

import { type RankInfo } from '@/lib/ranking'

export default function RankBadge({ rank, size = 'md' }: { rank: RankInfo; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { badge: 'px-2 py-0.5 text-[10px] gap-1', icon: 'text-sm' },
    md: { badge: 'px-3 py-1 text-xs gap-1.5', icon: 'text-base' },
    lg: { badge: 'px-4 py-1.5 text-sm gap-2', icon: 'text-lg' },
  }

  const s = sizes[size]

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md ${s.badge}`}
      style={{
        fontFamily: 'var(--font-pixel)',
        backgroundColor: `${rank.color}20`,
        color: rank.color,
        boxShadow: `0 0 12px ${rank.glow}`,
        border: `1px solid ${rank.color}40`,
      }}
    >
      <span className={s.icon}>{rank.icon}</span>
      {rank.label}
    </span>
  )
}
