'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { XP_REWARDS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, ROOM_LABELS } from '@/lib/xp'
import { api } from '@/lib/api'
import type { Task } from '@/types'

export default function TaskList({
  tasks,
  currentUserId,
}: {
  tasks: Task[]
  currentUserId: string
}) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)
  const [popup, setPopup] = useState<{
    taskId: string
    xp: number
    coins: number
    streak: number
    multiplier: number
    achievements: { name: string; icon: string }[]
  } | null>(null)

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  async function completeTask(taskId: string) {
    setCompleting(taskId)
    try {
      const data = await api.post(`/api/tasks/${taskId}/complete`)
      setPopup({
        taskId,
        xp: data.xpGained,
        coins: data.coinsGained,
        streak: data.streak,
        multiplier: data.streakMultiplier,
        achievements: data.newAchievements || [],
      })
      setTimeout(() => {
        setPopup(null)
        router.refresh()
      }, 2500)
    } catch (err) {
      console.error('Erreur complétion tâche:', err)
      router.refresh()
    }
    setCompleting(null)
  }

  const recurrenceLabel: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
  }

  return (
    <div className="space-y-6">
      {/* Tâches en attente */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">
          Tâches en attente{' '}
          <span className="text-gray-400 font-normal">({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
            Toutes les tâches sont faites ! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 relative overflow-hidden"
              >
                {/* Popup récompenses */}
                {popup?.taskId === task.id && (
                  <div className="absolute inset-0 bg-indigo-600 flex items-center justify-center rounded-xl animate-pulse">
                    <div className="text-center text-white">
                      <div className="font-bold text-xl">+{popup.xp} XP ⭐</div>
                      {popup.coins > 0 && (
                        <div className="text-sm mt-1">+{popup.coins} coins 🪙</div>
                      )}
                      {popup.multiplier > 1 && (
                        <div className="text-xs mt-1 opacity-80">
                          Streak x{popup.multiplier} 🔥 ({popup.streak}j)
                        </div>
                      )}
                      {popup.achievements.map((a) => (
                        <div key={a.name} className="text-sm mt-1 bg-white/20 rounded px-2 py-0.5">
                          {a.icon} {a.name} débloqué !
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => completeTask(task.id)}
                  disabled={completing === task.id}
                  className="w-7 h-7 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition flex-shrink-0 disabled:opacity-50"
                  title="Marquer comme fait"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[task.difficulty]}`}>
                      {DIFFICULTY_LABELS[task.difficulty]} · +{XP_REWARDS[task.difficulty]} XP
                    </span>
                    {task.category && (
                      <span className="text-xs text-gray-500">
                        {CATEGORY_ICONS[task.category]} {CATEGORY_LABELS[task.category]}
                      </span>
                    )}
                    {task.room && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ROOM_LABELS[task.room]}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="text-xs text-gray-500">
                        👤 {task.assignedTo.username}
                        {task.assignedTo.id === currentUserId && ' (toi)'}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {task.recurrence && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {recurrenceLabel[task.recurrence] ?? task.recurrence}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tâches terminées */}
      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-400 mb-3">
            Terminées ({done.length})
          </h2>
          <div className="space-y-2">
            {done.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-60"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700 line-through">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
