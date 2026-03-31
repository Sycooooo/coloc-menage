'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '📋',
  task_completed: '✅',
  new_event: '📅',
  new_board_item: '📌',
  quest_generated: '⚔️',
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    try {
      const data = await api.get('/api/notifications')
      setNotifications(data.notifications)
      setUnread(data.unreadCount)
    } catch {
      // silently fail
    }
  }

  async function markRead() {
    if (unread === 0) return
    try {
      await api.post('/api/notifications')
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silently fail
    }
  }

  function handleOpen() {
    setOpen(!open)
    if (!open) markRead()
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "à l'instant"
    if (mins < 60) return `il y a ${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `il y a ${days}j`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Aucune notification
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <a
                  key={n.id}
                  href={n.link || '#'}
                  className={`block px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition ${
                    !n.read ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
