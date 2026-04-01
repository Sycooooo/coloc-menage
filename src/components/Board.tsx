'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import BoardNote, { NOTE_COLORS } from './BoardNote'

type BoardItem = {
  id: string
  content: string
  type: string
  color: string
  size: string
  linkUrl: string | null
  position: number
  createdAt: string
  createdBy: { id: string; username: string }
}

export default function Board({ colocId, currentUserId }: { colocId: string; currentUserId: string }) {
  const [items, setItems] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Form state
  const [content, setContent] = useState('')
  const [color, setColor] = useState('yellow')
  const [size, setSize] = useState<'normal' | 'large'>('normal')
  const [linkUrl, setLinkUrl] = useState('')

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/board`)
      setItems(data)
    } catch (err) {
      console.error('Erreur chargement board:', err)
    }
    setLoading(false)
  }

  async function createItem() {
    if (!content.trim()) return
    try {
      await api.post(`/api/coloc/${colocId}/board`, {
        content: content.trim(),
        color,
        size,
        linkUrl: linkUrl.trim() || null,
        type: linkUrl.trim() ? 'link' : 'text',
      })
      setContent('')
      setLinkUrl('')
      setSize('normal')
      setShowForm(false)
      await loadItems()
    } catch (err) {
      console.error('Erreur création:', err)
    }
  }

  async function deleteItem(itemId: string) {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    try {
      await api.delete(`/api/coloc/${colocId}/board`, { itemId })
    } catch (err) {
      console.error('Erreur suppression:', err)
      await loadItems() // Revert on error
    }
  }

  async function editItem(itemId: string, data: { content?: string; color?: string; size?: string; linkUrl?: string }) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, ...data, type: data.linkUrl !== undefined ? (data.linkUrl ? 'link' : 'text') : i.type }
          : i
      )
    )
    try {
      await api.patch(`/api/coloc/${colocId}/board`, { itemId, ...data })
    } catch (err) {
      console.error('Erreur édition:', err)
      await loadItems() // Revert on error
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(items, oldIndex, newIndex)
    // Update positions
    const withPositions = newItems.map((item, index) => ({ ...item, position: index }))
    setItems(withPositions)

    try {
      await api.patch(`/api/coloc/${colocId}/board`, {
        action: 'reorder',
        items: withPositions.map((item) => ({ id: item.id, position: item.position })),
      })
    } catch (err) {
      console.error('Erreur reorder:', err)
      await loadItems()
    }
  }

  if (loading) {
    return <div className="text-center text-t-faint py-8">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-t-muted">{items.length} note{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-glow px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"
        >
          + Ajouter une note
        </button>
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <div className="card card-glow p-4 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ecris ta note ici..."
              rows={3}
              className="w-full px-3 py-2 border border-b rounded-lg text-sm resize-none text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Lien (optionnel)"
              className="w-full px-3 py-2 border border-b rounded-lg text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-[10px] text-t-faint">Formatage : **gras** · *italique* · - liste</p>

            {/* Couleur */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-t-muted">Couleur :</span>
              {Object.keys(NOTE_COLORS).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg ${NOTE_COLORS[c].bg} ${NOTE_COLORS[c].border} border-2 ${
                    color === c ? 'ring-2 ring-offset-1 ring-accent/50' : ''
                  }`}
                />
              ))}
            </div>

            {/* Taille */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-t-muted">Taille :</span>
              <button
                onClick={() => setSize('normal')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  size === 'normal' ? 'bg-accent text-white' : 'bg-surface-hover text-t-muted'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSize('large')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  size === 'large' ? 'bg-accent text-white' : 'bg-surface-hover text-t-muted'
                }`}
              >
                Large (2 colonnes)
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createItem}
                className="btn-glow px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"
              >
                Publier
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-surface-hover text-t-muted rounded-lg text-sm font-medium hover:text-t-primary transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Grille de post-its */}
      {items.length === 0 ? (
        <div className="card p-8 text-center text-t-faint">
          Aucune note pour l&apos;instant. Ajoute la première !
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(String(event.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <BoardNote
                    key={item.id}
                    item={item}
                    onDelete={deleteItem}
                    onEdit={editItem}
                    isDragging={activeId === item.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
