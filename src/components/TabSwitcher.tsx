'use client'

import Link from 'next/link'

type TabItem = { key: string; label: string; href: string }

export default function TabSwitcher({ tabs, active }: { tabs: TabItem[]; active: string }) {
  return (
    <div className="flex gap-1 px-6 py-2 border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          prefetch
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
