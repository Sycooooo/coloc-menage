'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { smooth } from '@/lib/animations'
import { api } from '@/lib/api'
import { getLevel, getXpForNextLevel } from '@/lib/xp'
import { getRankFromPoints } from '@/lib/ranking'
import RankBadge from '@/components/RankBadge'
import PixelIcon from '@/components/ui/PixelIcon'

type Props = {
  colocId: string
  colocName: string
  currentUserId: string
  members: { userId: string; username: string; avatar: string | null; rankPoints: number }[]
  lastMessages: { id: string; content: string; username: string; createdAt: string; type: string }[]
  nextEvent: { title: string; startDate: string; color: string } | null
  todayMeal: { lunch: string | null; dinner: string | null } | null
  userBalance: number
  boardCount: number
  userProfile: { xp: number; currentStreak: number; rankPoints: number }
  pendingTasksCount: number
  habitsToday: { completed: number; total: number }
  hasSpotify: boolean
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'hier'
  return `il y a ${d}j`
}

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const day = date.getDate()
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  if (date.toDateString() === now.toDateString()) return `Aujourd'hui, ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`
  if (date.toDateString() === tomorrow.toDateString()) return `Demain, ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`
  return `${days[date.getDay()]} ${day} ${months[date.getMonth()]}`
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export default function DashboardHub(props: Props) {
  const { colocId, currentUserId, members, lastMessages, nextEvent, todayMeal, userBalance, boardCount, userProfile, pendingTasksCount, habitsToday, hasSpotify } = props

  const level = getLevel(userProfile.xp)
  const xpInfo = getXpForNextLevel(userProfile.xp)
  const rank = getRankFromPoints(userProfile.rankPoints)

  // Mini chat state
  const [chatMessages, setChatMessages] = useState(lastMessages)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || sending) return
    setSending(true)
    try {
      await api.post(`/api/coloc/${colocId}/chat`, { content: chatInput.trim() })
      const me = members.find((m) => m.userId === currentUserId)
      setChatMessages((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        content: chatInput.trim(),
        username: me?.username ?? 'Moi',
        createdAt: new Date().toISOString(),
        type: 'text',
      }])
      setChatInput('')
    } catch (err) {
      console.error('Erreur envoi message:', err)
    }
    setSending(false)
  }

  // Music now playing
  const [nowPlaying, setNowPlaying] = useState<{ track: string; artist: string; art: string } | null>(null)
  useEffect(() => {
    if (!hasSpotify) return
    api.post(`/api/coloc/${colocId}/music/now-playing`).then((data) => {
      if (data?.track) {
        setNowPlaying({
          track: data.track.trackName,
          artist: data.track.artistName,
          art: data.track.albumArt,
        })
      }
    }).catch(() => {})
  }, [colocId, hasSpotify])

  return (
    <motion.div {...stagger} initial="initial" animate="animate" className="space-y-3">

      {/* Profil */}
      <motion.div {...fadeIn}>
        <Link href="/profile" className="block">
          <div className="card card-glow p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
              {members.find((m) => m.userId === currentUserId)?.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-pixel text-[10px] text-accent">Niv. {level}</span>
                <RankBadge rank={rank} size="sm" />
                {userProfile.currentStreak > 0 && (
                  <span className="text-xs text-amber-400 font-bold">🔥 {userProfile.currentStreak}</span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#0a0a14]/40 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${xpInfo.percent}%` }} />
              </div>
              <p className="font-pixel text-[8px] text-t-faint mt-1">{xpInfo.current}/{xpInfo.needed} XP</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Tâches + Habits row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/tasks`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="tasks" size={18} className="text-blue-400" />
                <span className="text-sm font-semibold text-t-primary">Tâches</span>
              </div>
              {pendingTasksCount > 0 ? (
                <p className="font-pixel text-[10px] text-amber-400">{pendingTasksCount} en attente</p>
              ) : (
                <p className="text-xs text-green-400">Tout est fait ✓</p>
              )}
            </div>
          </Link>
        </motion.div>

        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/habits`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="habits" size={18} className="text-orange-400" />
                <span className="text-sm font-semibold text-t-primary">Habits</span>
              </div>
              {habitsToday.total > 0 ? (
                <>
                  <p className="font-pixel text-[10px] text-accent">{habitsToday.completed}/{habitsToday.total} aujourd&apos;hui</p>
                  <div className="w-full h-1 rounded-full bg-[#0a0a14]/40 mt-1 overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(habitsToday.completed / habitsToday.total) * 100}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-t-faint">Aucune habitude</p>
              )}
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Mini Chat */}
      <motion.div {...fadeIn}>
        <div className="card card-glow p-0 overflow-hidden">
          <Link href={`/coloc/${colocId}/chat`} className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <PixelIcon name="chat" size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-t-primary flex-1">Chat</span>
            <span className="text-xs text-t-faint">voir tout →</span>
          </Link>
          <div className="h-32 overflow-y-auto px-4 py-2 space-y-1.5">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-t-faint text-center py-4">Aucun message</p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <span className="text-xs font-medium text-accent shrink-0">{msg.username}</span>
                  <p className="text-xs text-t-muted truncate">{msg.type === 'gif' ? '📷 GIF' : msg.content}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex border-t border-[var(--border)]">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message..."
              className="flex-1 px-4 py-2 text-xs bg-transparent text-t-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !chatInput.trim()}
              className="px-3 text-accent text-xs font-medium disabled:opacity-30"
            >
              ↑
            </button>
          </form>
        </div>
      </motion.div>

      {/* Music + Agenda row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/music`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="music" size={16} className="text-pink-400" />
                <span className="text-sm font-semibold text-t-primary">Music</span>
              </div>
              {nowPlaying ? (
                <div className="flex items-center gap-2">
                  {nowPlaying.art && (
                    <img src={nowPlaying.art} alt="" className="w-8 h-8 rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-t-primary truncate">{nowPlaying.track}</p>
                    <p className="text-[10px] text-t-faint truncate">{nowPlaying.artist}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-t-faint">Personne n&apos;écoute</p>
              )}
            </div>
          </Link>
        </motion.div>

        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/calendar`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="calendar" size={16} className="text-cyan-400" />
                <span className="text-sm font-semibold text-t-primary">Agenda</span>
              </div>
              {nextEvent ? (
                <>
                  <p className="text-xs text-t-primary truncate">{nextEvent.title}</p>
                  <p className="text-[10px] text-t-faint mt-0.5">{formatEventDate(nextEvent.startDate)}</p>
                </>
              ) : (
                <p className="text-xs text-t-faint">Rien de prévu</p>
              )}
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Menu + Argent row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/menu`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="menu" size={16} className="text-amber-400" />
                <span className="text-sm font-semibold text-t-primary">Menu</span>
              </div>
              {todayMeal ? (
                <div className="space-y-0.5">
                  {todayMeal.lunch && <p className="text-xs text-t-muted truncate">🌞 {todayMeal.lunch}</p>}
                  {todayMeal.dinner && <p className="text-xs text-t-muted truncate">🌙 {todayMeal.dinner}</p>}
                </div>
              ) : (
                <p className="text-xs text-t-faint">Pas de menu</p>
              )}
            </div>
          </Link>
        </motion.div>

        <motion.div {...fadeIn}>
          <Link href={`/coloc/${colocId}/expenses`} className="block h-full">
            <div className="card card-glow p-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <PixelIcon name="expenses" size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold text-t-primary">Argent</span>
              </div>
              <p className={`font-pixel text-sm ${userBalance > 0 ? 'text-green-400' : userBalance < 0 ? 'text-red-400' : 'text-t-faint'}`}>
                {userBalance > 0 ? '+' : ''}{userBalance.toFixed(2)}€
              </p>
              <p className="text-[10px] text-t-faint mt-0.5">
                {userBalance > 0 ? 'On te doit' : userBalance < 0 ? 'Tu dois' : 'À jour'}
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Tableau */}
      <motion.div {...fadeIn}>
        <Link href={`/coloc/${colocId}/board`} className="block">
          <div className="card card-glow p-4 flex items-center gap-3">
            <PixelIcon name="board" size={18} className="text-rose-400" />
            <span className="text-sm font-semibold text-t-primary">Tableau</span>
            <span className="text-xs text-t-faint ml-auto">{boardCount} note{boardCount !== 1 ? 's' : ''}</span>
          </div>
        </Link>
      </motion.div>

    </motion.div>
  )
}
