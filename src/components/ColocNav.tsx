'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { pusherClient } from '@/lib/pusher-client'

type Props = {
  colocId: string
  currentUserId: string
}

export default function ColocNav({ colocId, currentUserId }: Props) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const [unread, setUnread] = useState({ chat: false, tasks: false, board: false })

  // Keep ref in sync
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Clear unread badge when visiting the page
  useEffect(() => {
    if (pathname.includes('/chat')) setUnread((prev) => ({ ...prev, chat: false }))
    if (pathname === `/coloc/${colocId}`) setUnread((prev) => ({ ...prev, tasks: false }))
    if (pathname.includes('/board')) setUnread((prev) => ({ ...prev, board: false }))
  }, [pathname, colocId])

  // Global Pusher listener — plays sounds and tracks unread badges
  useEffect(() => {
    const channel = pusherClient.subscribe(`coloc-${colocId}`)

    function getSoundPref(key: string): boolean {
      try {
        // Vérifier le mode "ne pas déranger"
        const dndRaw = localStorage.getItem('dnd_prefs')
        if (dndRaw) {
          const dnd = JSON.parse(dndRaw)
          if (dnd.enabled) {
            const now = new Date()
            const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            const { start, end } = dnd
            // Ex: 23:00 → 08:00 (passe minuit)
            if (start > end) {
              if (hhmm >= start || hhmm < end) return false
            } else {
              if (hhmm >= start && hhmm < end) return false
            }
          }
        }
        const stored = localStorage.getItem('notif_prefs')
        if (stored) {
          const prefs = JSON.parse(stored)
          return prefs[key] !== false
        }
      } catch {}
      return true
    }

    const onNewMessage = (data: { user: { id: string } }) => {
      if (data.user.id === currentUserId) return
      if (getSoundPref('sound_chat')) {
        new Audio('/sounds/notification-chat.mp3').play().catch(() => {})
      }
      if (!pathnameRef.current.includes('/chat')) {
        setUnread((prev) => ({ ...prev, chat: true }))
      }
    }

    const onNewTask = () => {
      if (getSoundPref('sound_tasks')) {
        new Audio('/sounds/notification-tache.mp3').play().catch(() => {})
      }
      if (pathnameRef.current !== `/coloc/${colocId}`) {
        setUnread((prev) => ({ ...prev, tasks: true }))
      }
    }

    const onNewBoardItem = (data: { createdBy: { id: string } }) => {
      if (data.createdBy.id === currentUserId) return
      if (getSoundPref('sound_board')) {
        new Audio('/sounds/notification-tableau.mp3').play().catch(() => {})
      }
      if (!pathnameRef.current.includes('/board')) {
        setUnread((prev) => ({ ...prev, board: true }))
      }
    }

    channel.bind('new-message', onNewMessage)
    channel.bind('new-task', onNewTask)
    channel.bind('new-board-item', onNewBoardItem)

    return () => {
      channel.unbind('new-message', onNewMessage)
      channel.unbind('new-task', onNewTask)
      channel.unbind('new-board-item', onNewBoardItem)
    }
  }, [colocId, currentUserId])

  const base = `/coloc/${colocId}`

  const links = [
    { href: base, label: 'Tâches', icon: '📋', unreadKey: 'tasks' as const, match: (p: string) => p === base },
    { href: `${base}/chat`, label: 'Chat', icon: '💬', unreadKey: 'chat' as const, match: (p: string) => p.includes('/chat') },
    { href: `${base}/board`, label: 'Tableau', icon: '📌', unreadKey: 'board' as const, match: (p: string) => p.includes('/board') },
    { href: `${base}/calendar`, label: 'Calendrier', icon: '📅', unreadKey: null, match: (p: string) => p.includes('/calendar') },
    { href: `${base}/music`, label: 'Music', icon: '🎵', unreadKey: null, match: (p: string) => p.includes('/music') },
    { href: `${base}/menu`, label: 'Menu', icon: '🍽️', unreadKey: null, match: (p: string) => p.includes('/menu') },
    { href: `${base}/expenses`, label: 'Dépenses', icon: '💰', unreadKey: null, match: (p: string) => p.includes('/expenses') },
    { href: '/profile', label: 'Profil', icon: '👤', unreadKey: null, match: (p: string) => p.startsWith('/profile') },
  ]

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a14]/80 backdrop-blur-xl border-t border-[rgba(192,132,252,0.08)]" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto py-1.5">
        {links.map((link) => {
          const isActive = link.match(pathname)
          const hasUnread = link.unreadKey ? unread[link.unreadKey] : false
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition ${
                isActive ? 'text-accent' : 'text-t-muted hover:text-t-primary'
              }`}
            >
              <span className={`text-lg relative ${isActive ? 'drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]' : ''}`}>
                {link.icon}
                {hasUnread && (
                  <span role="status" aria-label="Non lu" className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface animate-pulse" />
                )}
              </span>
              <span className="text-xs font-medium leading-tight">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
