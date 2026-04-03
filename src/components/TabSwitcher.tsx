'use client'

import Link from 'next/link'

type Tab = 'tasks' | 'habits'

export default function TabSwitcher({ colocId, active }: { colocId: string; active: Tab }) {
  const tabs = [
    { key: 'tasks' as const, label: '📋 Tâches', href: `/coloc/${colocId}` },
    { key: 'habits' as const, label: '🔥 Habitudes', href: `/coloc/${colocId}/habits` },
  ]

  return (
    <div className="flex gap-1 px-6 py-2 border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`relative px-4 py-2 rounded-lg text-sm font-medium transition ${
            active === tab.key ? 'text-accent' : 'text-t-muted hover:text-t-primary'
          }`}
        >
          {active === tab.key && (
            <div className="absolute inset-0 rounded-lg bg-accent/10" />
          )}
          <span className="relative">{tab.label}</span>
        </Link>
      ))}
    </div>
  )
}
