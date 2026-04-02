'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  allDay: boolean
  color: string
  createdBy: { id: string; username: string }
}

const COLORS: Record<string, string> = {
  indigo: 'bg-accent',
  red: 'bg-red-500',
  green: 'bg-green-500',
  amber: 'bg-accent-secondary',
  purple: 'bg-purple-500',
}

const COLOR_DOTS: Record<string, string> = {
  indigo: 'bg-accent/70',
  red: 'bg-red-400',
  green: 'bg-green-400',
  amber: 'bg-accent-secondary/70',
  purple: 'bg-purple-400',
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function Calendar({ colocId }: { colocId: string }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'year' | 'month'>('year')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('12:00')
  const [color, setColor] = useState('indigo')
  const [allDay, setAllDay] = useState(false)

  // Charger les events selon la vue
  useEffect(() => {
    if (view === 'year') {
      loadYearEvents()
    } else {
      loadMonthEvents()
    }
  }, [year, month, view])

  async function loadYearEvents() {
    setLoading(true)
    try {
      // Charger tous les mois de l'année
      const allEvents: CalendarEvent[] = []
      for (let m = 0; m < 12; m++) {
        const data = await api.get(`/api/coloc/${colocId}/events?year=${year}&month=${m}`)
        allEvents.push(...data)
      }
      // Dédupliquer par id
      const unique = allEvents.filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
      setEvents(unique)
    } catch (err) {
      console.error('Erreur chargement events:', err)
    }
    setLoading(false)
  }

  async function loadMonthEvents() {
    setLoading(true)
    try {
      const data = await api.get(`/api/coloc/${colocId}/events?year=${year}&month=${month}`)
      setEvents(data)
    } catch (err) {
      console.error('Erreur chargement events:', err)
    }
    setLoading(false)
  }

  async function createEvent() {
    if (!title.trim() || selectedDay === null) return
    const startDate = new Date(year, month, selectedDay)
    if (!allDay) {
      const [h, m] = startTime.split(':')
      startDate.setHours(parseInt(h), parseInt(m))
    }
    try {
      await api.post(`/api/coloc/${colocId}/events`, {
        title: title.trim(),
        description: description.trim() || null,
        startDate: startDate.toISOString(),
        allDay,
        color,
      })
      setTitle('')
      setDescription('')
      setShowForm(false)
      setSelectedDay(null)
      if (view === 'year') await loadYearEvents()
      else await loadMonthEvents()
    } catch (err) {
      console.error('Erreur création:', err)
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      await api.delete(`/api/coloc/${colocId}/events`, { eventId })
      if (view === 'year') await loadYearEvents()
      else await loadMonthEvents()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  function getEventsForDay(m: number, day: number) {
    return events.filter((e) => {
      const d = new Date(e.startDate)
      return d.getDate() === day && d.getMonth() === m && d.getFullYear() === year
    })
  }

  function getEventsForMonth(m: number) {
    return events.filter((e) => {
      const d = new Date(e.startDate)
      return d.getMonth() === m && d.getFullYear() === year
    })
  }

  function openMonth(m: number) {
    setMonth(m)
    setView('month')
    setSelectedDay(null)
    setShowForm(false)
  }

  function backToYear() {
    setView('year')
    setSelectedDay(null)
    setShowForm(false)
  }

  const today = new Date()

  // ========== VUE ANNÉE ==========
  if (view === 'year') {
    return (
      <div className="space-y-4">
        {/* Header année */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setYear(year - 1)}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-[var(--border)] rounded-lg text-lg font-bold text-t-muted hover:bg-surface-hover transition"
          >
            &larr;
          </button>
          <h2 className="font-display text-2xl tracking-wide text-t-primary min-w-[100px] text-center uppercase">
            {year}
          </h2>
          <button
            type="button"
            onClick={() => setYear(year + 1)}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-[var(--border)] rounded-lg text-lg font-bold text-t-muted hover:bg-surface-hover transition"
          >
            &rarr;
          </button>
        </div>

        {/* Grille 12 mois */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, m) => {
            const firstDay = new Date(year, m, 1)
            const daysInMonth = new Date(year, m + 1, 0).getDate()
            const startOffset = (firstDay.getDay() + 6) % 7
            const monthEvents = getEventsForMonth(m)
            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m

            return (
              <motion.div
                key={m}
                onClick={() => openMonth(m)}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`bg-surface rounded-lg border p-3 cursor-pointer hover:border-accent/50 transition-colors ${
                  isCurrentMonth ? 'border-accent' : 'border-[var(--border)]'
                }`}
                style={{ boxShadow: isCurrentMonth ? 'var(--shadow)' : undefined }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-accent' : 'text-t-primary'}`}>
                    {MONTH_SHORT[m]}
                  </span>
                  {monthEvents.length > 0 && (
                    <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-medium">
                      {monthEvents.length}
                    </span>
                  )}
                </div>

                {/* Mini grille jours */}
                <div className="grid grid-cols-7 gap-px">
                  {DAY_SHORT.map((d, i) => (
                    <div key={i} className="text-[9px] text-t-faint text-center">{d}</div>
                  ))}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`e-${i}`} className="h-4" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isToday = isCurrentMonth && today.getDate() === day
                    const hasEvent = monthEvents.some((e) => new Date(e.startDate).getDate() === day)

                    return (
                      <div
                        key={day}
                        className={`h-4 flex items-center justify-center text-[9px] rounded-full ${
                          isToday
                            ? 'bg-accent text-white font-bold'
                            : hasEvent
                              ? 'bg-accent/15 text-accent font-medium'
                              : 'text-t-faint'
                        }`}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // ========== VUE MOIS ==========
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className="space-y-4">
      {/* Header mois */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (month === 0) { setMonth(11); setYear(year - 1) }
            else setMonth(month - 1)
          }}
          className="w-10 h-10 flex items-center justify-center bg-surface border border-[var(--border)] rounded-lg text-lg font-bold text-t-muted hover:bg-surface-hover transition"
        >
          &larr;
        </button>
        <button
          type="button"
          onClick={backToYear}
          className="font-display text-lg tracking-wide text-t-primary min-w-[200px] text-center uppercase hover:text-accent transition"
        >
          {MONTH_NAMES[month]} {year}
        </button>
        <button
          type="button"
          onClick={() => {
            if (month === 11) { setMonth(0); setYear(year + 1) }
            else setMonth(month + 1)
          }}
          className="w-10 h-10 flex items-center justify-center bg-surface border border-[var(--border)] rounded-lg text-lg font-bold text-t-muted hover:bg-surface-hover transition"
        >
          &rarr;
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-surface-hover border-b border-[var(--border)]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-t-muted py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-[var(--border)]/50 bg-surface/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = getEventsForDay(month, day)
            const isToday = isCurrentMonth && today.getDate() === day
            const isSelected = selectedDay === day

            return (
              <div
                key={day}
                onClick={() => { setSelectedDay(day); setShowForm(true) }}
                className={`h-20 border-b border-r border-[var(--border)]/50 p-1 cursor-pointer hover:bg-accent/5 transition ${
                  isSelected ? 'bg-accent/10' : ''
                }`}
              >
                <span
                  className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
                    isToday ? 'bg-accent text-white' : 'text-t-muted'
                  }`}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`text-[10px] text-white px-1 py-0.5 rounded truncate ${COLORS[e.color] || COLORS.indigo}`}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-t-faint">+{dayEvents.length - 2}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <AnimatePresence>
      {showForm && selectedDay !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="card card-glow p-4 space-y-3 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-t-primary">
              Nouvel événement — {selectedDay} {MONTH_NAMES[month]}
            </h3>
            <button onClick={() => { setShowForm(false); setSelectedDay(null) }} className="text-t-faint hover:text-t-muted">
              ✕
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'événement"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-t-muted">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded"
              />
              Toute la journée
            </label>
            {!allDay && (
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2 py-1 border border-[var(--border)] rounded-lg text-sm text-t-primary bg-input-bg"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-t-muted">Couleur :</span>
            {Object.keys(COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${COLOR_DOTS[c]} ${
                  color === c ? 'ring-2 ring-offset-1 ring-accent/50' : ''
                }`}
              />
            ))}
          </div>
          <motion.button
            onClick={createEvent}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-glow px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Créer
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Liste des événements du jour sélectionné */}
      <AnimatePresence>
      {selectedDay !== null && getEventsForDay(month, selectedDay).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="card p-4 space-y-2"
        >
          <h3 className="font-semibold text-t-primary text-sm">
            {selectedDay} {MONTH_NAMES[month]}
          </h3>
          {getEventsForDay(month, selectedDay).map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 bg-surface-hover rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${COLORS[e.color]}`} />
                <div>
                  <p className="text-sm font-medium text-t-primary">{e.title}</p>
                  {e.description && <p className="text-xs text-t-muted">{e.description}</p>}
                  <p className="text-xs text-t-faint">
                    {e.allDay ? 'Toute la journée' : new Date(e.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{e.createdBy.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(e.id)}
                className="text-danger hover:text-red-600 text-xs"
              >
                Supprimer
              </button>
            </div>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
