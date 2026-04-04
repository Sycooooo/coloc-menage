'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { smooth, snappy } from '@/lib/animations'

type Story = {
  id: string
  trackName: string
  artistName: string
  albumArt: string
  spotifyUrl: string
  caption: string | null
  createdAt: string
  username: string
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export default function MusicMemories({ stories }: { stories: Story[] }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  // Map des jours qui ont des stories
  const storyDays = new Map<string, Story[]>()
  for (const story of stories) {
    const d = new Date(story.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!storyDays.has(key)) storyDays.set(key, [])
    storyDays.get(key)!.push(story)
  }

  function getStoriesForDay(date: Date): Story[] {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return storyDays.get(key) ?? []
  }

  // Grille du calendrier
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Lundi = 0
  const totalDays = lastDay.getDate()

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
  }

  const selectedStories = selectedDay ? getStoriesForDay(selectedDay) : []

  // Compter les stories du mois
  const monthStoryCount = stories.filter((s) => {
    const d = new Date(s.createdAt)
    return d.getMonth() === month && d.getFullYear() === year
  }).length

  return (
    <div className="space-y-4">
      {/* Header mois */}
      <div className="card card-glow p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-t-muted hover:text-t-primary transition px-2 py-1">←</button>
          <div className="text-center">
            <h2 className="font-display text-xl tracking-wide text-t-primary uppercase">{MONTH_NAMES[month]} {year}</h2>
            <p className="text-xs text-t-faint mt-0.5 font-pixel text-[8px]">{monthStoryCount} memorie{monthStoryCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={nextMonth} className="text-t-muted hover:text-t-primary transition px-2 py-1">→</button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] text-t-faint font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Jours */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1
            const date = new Date(year, month, day)
            const dayStories = getStoriesForDay(date)
            const hasStories = dayStories.length > 0
            const isToday = isSameDay(date, now)
            const isSelected = selectedDay && isSameDay(date, selectedDay)

            return (
              <button
                key={day}
                onClick={() => hasStories ? setSelectedDay(date) : null}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition ${
                  isSelected
                    ? 'bg-pink-500/30 border border-pink-400 text-pink-300'
                    : hasStories
                      ? 'bg-pink-500/10 hover:bg-pink-500/20 text-t-primary cursor-pointer border border-pink-500/20'
                      : isToday
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-t-muted'
                }`}
              >
                <span className={`font-medium ${hasStories ? 'text-pink-300' : ''}`}>{day}</span>
                {hasStories && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayStories.slice(0, 3).map((_, j) => (
                      <div key={j} className="w-1 h-1 rounded-full bg-pink-400" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Stories du jour sélectionné */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={smooth}
            className="card card-glow p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-t-primary">
                {selectedDay.getDate()} {MONTH_NAMES[selectedDay.getMonth()]}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-t-faint hover:text-t-muted text-sm">✕</button>
            </div>

            {selectedStories.length === 0 ? (
              <p className="text-sm text-t-faint text-center py-4">Aucune story ce jour</p>
            ) : (
              <div className="space-y-2">
                {selectedStories.map((story) => (
                  <motion.a
                    key={story.id}
                    href={story.spotifyUrl}
                    target="_blank"
                    rel="noopener"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={snappy}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#161628]/60 hover:bg-[#161628]/80 backdrop-blur-lg border border-[var(--border)] transition"
                  >
                    {story.albumArt ? (
                      <img src={story.albumArt} alt="" className="w-12 h-12 rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-xl flex-shrink-0">🎵</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t-primary truncate">{story.trackName}</p>
                      <p className="text-xs text-t-muted truncate">{story.artistName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-pink-400 font-medium">{story.username}</span>
                        <span className="text-[10px] text-t-faint">
                          {new Date(story.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {story.caption && (
                          <span className="text-[10px] text-t-faint italic truncate">&ldquo;{story.caption}&rdquo;</span>
                        )}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {stories.length === 0 && (
        <div className="card p-8 text-center text-t-faint">
          <p className="text-2xl mb-2">🎵</p>
          <p className="text-sm">Aucune memory pour l&apos;instant</p>
          <p className="text-xs mt-1">Partage un son en story pour créer ta première memory !</p>
        </div>
      )}
    </div>
  )
}
