'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import type { Member } from '@/types'

export default function AddTaskForm({
  colocId,
  members,
}: {
  colocId: string
  members: Member[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await api.post('/api/tasks', {
      title,
      description: description || null,
      colocId,
      assignedToId: assignedToId || null,
      dueDate: dueDate || null,
      recurrence: recurrence || null,
      difficulty,
      room: room || null,
    })

    setTitle('')
    setDescription('')
    setAssignedToId('')
    setDueDate('')
    setRecurrence('')
    setDifficulty('medium')
    setRoom('')
    setOpen(false)
    setLoading(false)
    router.refresh()
    toast.success('Tâche ajoutée')
  }

  return (
    <AnimatePresence mode="wait">
      {!open ? (
        <motion.button
          key="add-btn"
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          whileHover={{ scale: 1.01, borderColor: 'var(--accent)' }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3 border-2 border-dashed border-b-hover rounded-lg text-t-muted hover:border-accent hover:text-accent transition-colors font-medium"
        >
          + Ajouter une tâche
        </motion.button>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-surface rounded-xl border border-accent/20 p-5 overflow-hidden"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-semibold text-t-primary mb-4">Nouvelle tâche</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Titre de la tâche"
              className="w-full px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
            />

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              className="w-full px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
            />

            {/* Difficulté / XP */}
            <div>
              <label className="block text-sm font-medium text-t-muted mb-2">Difficulté</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'easy', label: 'Facile', xp: '+20 XP', color: 'border-[#4ade80] bg-[#4ade80]/15 text-[#4ade80]' },
                  { value: 'medium', label: 'Moyen', xp: '+50 XP', color: 'border-accent-secondary bg-accent-secondary/15 text-accent-secondary' },
                  { value: 'hard', label: 'Difficile', xp: '+100 XP', color: 'border-accent-tertiary bg-accent-tertiary/15 text-accent-tertiary' },
                ].map((d) => (
                  <motion.button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      difficulty === d.value ? d.color : 'border-b text-t-muted hover:border-b-hover'
                    }`}
                  >
                    {d.label}<br />
                    <span className="text-xs font-bold">{d.xp}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
              >
                <option value="">Assigner à...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
              >
                <option value="">Pièce...</option>
                <option value="sejour">🛋️ Séjour</option>
                <option value="cuisine">🍳 Cuisine</option>
                <option value="sdb">🚿 Salle d&apos;eau</option>
                <option value="wc">🚽 WC</option>
                <option value="chambre1">🛏️ Chambre 1</option>
                <option value="chambre2">🛏️ Chambre 2</option>
                <option value="chambre3">🛏️ Chambre 3</option>
                <option value="couloir">🚪 Couloir</option>
                <option value="buanderie">🧺 Buanderie</option>
                <option value="balcon">☀️ Balcon</option>
                <option value="loggia">🌿 Loggia</option>
              </select>

              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
              >
                <option value="">Pas de récurrence</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-b rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
            />

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                fullWidth
                className="flex-1"
              >
                Ajouter
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
