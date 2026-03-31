'use client'

import { useState, useEffect } from 'react'
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
  indigo: 'bg-indigo-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
}

const COLOR_DOTS: Record<string, string> = {
  indigo: 'bg-indigo-400',
  red: 'bg-red-400',
  green: 'bg-green-400',
  amber: 'bg-amber-400',
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
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition"
          >
            &larr;
          </button>
          <h2 className="text-2xl font-bold text-gray-900 min-w-[100px] text-center">
            {year}
          </h2>
          <button
            type="button"
            onClick={() => setYear(year + 1)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition"
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
              <div
                key={m}
                onClick={() => openMonth(m)}
                className={`bg-white rounded-xl border p-3 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition ${
                  isCurrentMonth ? 'border-indigo-400 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {MONTH_SHORT[m]}
                  </span>
                  {monthEvents.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
                      {monthEvents.length}
                    </span>
                  )}
                </div>

                {/* Mini grille jours */}
                <div className="grid grid-cols-7 gap-px">
                  {DAY_SHORT.map((d, i) => (
                    <div key={i} className="text-[9px] text-gray-400 text-center">{d}</div>
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
                            ? 'bg-indigo-600 text-white font-bold'
                            : hasEvent
                              ? 'bg-indigo-100 text-indigo-700 font-medium'
                              : 'text-gray-600'
                        }`}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </div>
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
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition"
        >
          &larr;
        </button>
        <button
          type="button"
          onClick={backToYear}
          className="text-lg font-bold text-gray-900 min-w-[200px] text-center hover:text-indigo-600 transition"
        >
          {MONTH_NAMES[month]} {year}
        </button>
        <button
          type="button"
          onClick={() => {
            if (month === 11) { setMonth(0); setYear(year + 1) }
            else setMonth(month + 1)
          }}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition"
        >
          &rarr;
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-100 bg-gray-50/50" />
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
                className={`h-20 border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-indigo-50/50 transition ${
                  isSelected ? 'bg-indigo-50' : ''
                }`}
              >
                <span
                  className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
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
                    <span className="text-[10px] text-gray-400">+{dayEvents.length - 2}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && selectedDay !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Nouvel événement — {selectedDay} {MONTH_NAMES[month]}
            </h3>
            <button onClick={() => { setShowForm(false); setSelectedDay(null) }} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'événement"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
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
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Couleur :</span>
            {Object.keys(COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${COLOR_DOTS[c]} ${
                  color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                }`}
              />
            ))}
          </div>
          <button
            onClick={createEvent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Créer
          </button>
        </div>
      )}

      {/* Liste des événements du jour sélectionné */}
      {selectedDay !== null && getEventsForDay(month, selectedDay).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">
            {selectedDay} {MONTH_NAMES[month]}
          </h3>
          {getEventsForDay(month, selectedDay).map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${COLORS[e.color]}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.title}</p>
                  {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                  <p className="text-xs text-gray-400">
                    {e.allDay ? 'Toute la journée' : new Date(e.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{e.createdBy.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(e.id)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
