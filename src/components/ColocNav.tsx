'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { pusherClient } from '@/lib/pusher-client'
import { snappy, bouncy, scaleBounce } from '@/lib/animations'
import PixelIcon from '@/components/ui/PixelIcon'
import type { IconName } from '@/components/ui/PixelIcon'

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

  const links: { href: string; label: string; pixelIcon: IconName; unreadKey: 'tasks' | 'chat' | 'board' | null; match: (p: string) => boolean }[] = [
    { href: base, label: 'Tâches', pixelIcon: 'tasks', unreadKey: 'tasks', match: (p) => p === base || p.includes('/habits') },
    { href: `${base}/chat`, label: 'Social', pixelIcon: 'chat', unreadKey: 'chat', match: (p) => p.includes('/chat') || p.includes('/board') },
    { href: `${base}/calendar`, label: 'Agenda', pixelIcon: 'calendar', unreadKey: null, match: (p) => p.includes('/calendar') },
    { href: `${base}/music`, label: 'Music', pixelIcon: 'music', unreadKey: null, match: (p) => p.includes('/music') },
    { href: `${base}/menu`, label: 'Menu', pixelIcon: 'menu', unreadKey: null, match: (p) => p.includes('/menu') },
    { href: `${base}/expenses`, label: 'Argent', pixelIcon: 'expenses', unreadKey: null, match: (p) => p.includes('/expenses') },
    { href: '/profile', label: 'Profil', pixelIcon: 'profile', unreadKey: null, match: (p) => p.startsWith('/profile') },
  ]

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a14]/55 backdrop-blur-2xl border-t border-[rgba(192,132,252,0.08)]" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto py-1.5">
        {links.map((link) => {
          const isActive = link.match(pathname)
          const hasUnread = link.unreadKey ? unread[link.unreadKey] : false
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition ${
                isActive ? 'text-accent' : 'text-t-muted hover:text-t-primary'
              }`}
            >
              {/* Indicateur actif glissant */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-accent/10"
                  transition={snappy}
                />
              )}
              <motion.span
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={bouncy}
                className={`relative ${isActive ? 'drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]' : ''}`}
              >
                <PixelIcon name={link.pixelIcon} size={18} />
                <AnimatePresence>
                  {hasUnread && (
                    <motion.span
                      role="status"
                      aria-label="Non lu"
                      {...scaleBounce}
                      className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface"
                    />
                  )}
                </AnimatePresence>
              </motion.span>
              <span className="text-[7px] font-pixel leading-tight relative">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
