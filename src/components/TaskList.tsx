'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  recurrence: string | null
  dueDate: Date | null
  assignedTo: { id: string; name: string; avatar: string | null } | null
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

  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')

  async function completeTask(taskId: string) {
    setCompleting(taskId)
    await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
    router.refresh()
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
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                <button
                  onClick={() => completeTask(task.id)}
                  disabled={completing === task.id}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition flex-shrink-0 disabled:opacity-50"
                  title="Marquer comme fait"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {task.assignedTo && (
                      <span className="text-xs text-gray-500">
                        👤 {task.assignedTo.name}
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
