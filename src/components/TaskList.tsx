'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { XP_REWARDS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, ROOM_LABELS } from '@/lib/xp'
import { api } from '@/lib/api'
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerList'
import type { Task } from '@/types'

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: -(Math.random() * 150 + 50),
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.5 + 0.5,
      color: ['#a855f7', '#c084fc', '#f97316', '#fb923c', '#38bdf8', '#e8c97a'][
        Math.floor(Math.random() * 6)
      ],
    }))
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: '50%', y: '50%', opacity: 1, scale: 0 }}
          animate={{
            x: `calc(50% + ${p.x}px)`,
            y: `calc(50% + ${p.y}px)`,
            opacity: 0,
            scale: p.scale,
            rotate: p.rotation,
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}

export default function TaskList({
  tasks,
  currentUserId,
}: {
  tasks: Task[]
  currentUserId: string
}) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)
  const [reserving, setReserving] = useState<string | null>(null)
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

  async function toggleReserve(taskId: string) {
    setReserving(taskId)
    try {
      await api.post(`/api/tasks/${taskId}/reserve`)
      router.refresh()
    } catch (err) {
      console.error('Erreur réservation:', err)
    }
    setReserving(null)
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
        <h2 className="font-semibold text-t-primary mb-3">
          Tâches en attente{' '}
          <span className="text-t-faint font-normal">({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-b p-8 text-center text-t-faint">
            Toutes les tâches sont faites ! 🎉
          </div>
        ) : (
          <StaggerContainer className="space-y-2">
            {pending.map((task) => (
              <StaggerItem key={task.id}>
              <div
                className="bg-surface rounded-xl border border-b p-4 flex items-center gap-4 relative overflow-hidden"
              >
                {/* Popup récompenses animé */}
                <AnimatePresence>
                  {popup?.taskId === task.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute inset-0 bg-accent flex items-center justify-center rounded-xl z-10"
                    >
                      <Confetti />
                      <div className="text-center text-white z-20">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="font-bold text-xl"
                        >
                          +{popup.xp} XP ⭐
                        </motion.div>
                        {popup.coins > 0 && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="text-sm mt-1"
                          >
                            +{popup.coins} coins 🪙
                          </motion.div>
                        )}
                        {popup.multiplier > 1 && (
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs mt-1 opacity-80"
                          >
                            Streak x{popup.multiplier} 🔥 ({popup.streak}j)
                          </motion.div>
                        )}
                        {popup.achievements.map((a, i) => (
                          <motion.div
                            key={a.name}
                            initial={{ y: 20, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
                            className="text-sm mt-1 bg-white/20 rounded px-2 py-0.5"
                          >
                            {a.icon} {a.name} débloqué !
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => completeTask(task.id)}
                  disabled={completing === task.id}
                  className="w-7 h-7 rounded-full border-2 border-b-hover hover:border-accent hover:bg-accent/10 transition flex-shrink-0 disabled:opacity-50"
                  title="Marquer comme fait"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-t-primary">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-t-muted mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[task.difficulty]}`}>
                      {DIFFICULTY_LABELS[task.difficulty]} · +{XP_REWARDS[task.difficulty]} XP
                    </span>
                    {task.category && (
                      <span className="text-xs text-t-muted">
                        {CATEGORY_ICONS[task.category]} {CATEGORY_LABELS[task.category]}
                      </span>
                    )}
                    {task.room && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {ROOM_LABELS[task.room]}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span className="text-xs text-t-muted">
                        👤 {task.assignedTo.username}
                        {task.assignedTo.id === currentUserId && ' (toi)'}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-t-muted">
                        📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {task.recurrence && (
                      <span className="text-xs bg-accent-tertiary/15 text-accent-tertiary px-2 py-0.5 rounded-full">
                        {recurrenceLabel[task.recurrence] ?? task.recurrence}
                      </span>
                    )}
                  </div>
                </div>
                {/* Bouton réserver / libérer */}
                {!task.assignedTo ? (
                  <button
                    onClick={() => toggleReserve(task.id)}
                    disabled={reserving === task.id}
                    className="px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition disabled:opacity-50 flex-shrink-0"
                  >
                    {reserving === task.id ? '...' : 'Réserver'}
                  </button>
                ) : task.assignedTo.id === currentUserId ? (
                  <button
                    onClick={() => toggleReserve(task.id)}
                    disabled={reserving === task.id}
                    className="px-3 py-1.5 text-xs font-medium bg-surface-hover text-t-muted rounded-lg hover:bg-b transition disabled:opacity-50 flex-shrink-0"
                  >
                    {reserving === task.id ? '...' : 'Libérer'}
                  </button>
                ) : null}
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Tâches terminées */}
      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-t-faint mb-3">
            Terminées ({done.length})
          </h2>
          <div className="space-y-2">
            {done.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="bg-surface rounded-xl border border-b p-4 flex items-center gap-4 opacity-50"
              >
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-t-muted line-through">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
