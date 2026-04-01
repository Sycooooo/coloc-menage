'use client'

import { useState, useEffect, useRef } from 'react'
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
  imageUrl: string | null
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Drop zone state
  const [dragOver, setDragOver] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadItems()
  }, [])

  // Global drag-and-drop d'image sur la page
  useEffect(() => {
    const el = dropRef.current
    if (!el) return

    function handleDragEnter(e: DragEvent) {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) {
        setDragOver(true)
      }
    }
    function handleDragOver(e: DragEvent) {
      e.preventDefault()
    }
    function handleDragLeave(e: DragEvent) {
      // Only hide if we actually left the container
      if (el && !el.contains(e.relatedTarget as Node)) {
        setDragOver(false)
      }
    }
    async function handleDrop(e: DragEvent) {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer?.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      if (file.size > 5 * 1024 * 1024) {
        alert('Image trop grande (max 5Mo)')
        return
      }
      // Upload directement
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('color', 'yellow')
        formData.append('size', 'normal')
        formData.append('content', file.name.replace(/\.[^.]+$/, ''))
        await api.upload(`/api/coloc/${colocId}/board/upload`, formData)
        await loadItems()
      } catch (err) {
        console.error('Erreur upload drop:', err)
      }
      setUploading(false)
    }

    el.addEventListener('dragenter', handleDragEnter)
    el.addEventListener('dragover', handleDragOver)
    el.addEventListener('dragleave', handleDragLeave)
    el.addEventListener('drop', handleDrop)
    return () => {
      el.removeEventListener('dragenter', handleDragEnter)
      el.removeEventListener('dragover', handleDragOver)
      el.removeEventListener('dragleave', handleDragLeave)
      el.removeEventListener('drop', handleDrop)
    }
  }, [colocId])

  async function loadItems() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/board`)
      setItems(data)
    } catch (err) {
      console.error('Erreur chargement board:', err)
    }
    setLoading(false)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop grande (max 5Mo)')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = ta.value
    const selected = text.substring(start, end)
    const newText = text.substring(0, start) + before + selected + after + text.substring(end)
    setContent(newText)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = start + before.length
      ta.selectionEnd = end + before.length
    }, 0)
  }

  function insertPrefix(prefix: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const text = ta.value
    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart)
    setContent(newText)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + prefix.length
    }, 0)
  }

  async function createItem() {
    if (!content.trim() && !imageFile) return
    setUploading(true)
    try {
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('color', color)
        formData.append('size', size)
        formData.append('content', content.trim())
        await api.upload(`/api/coloc/${colocId}/board/upload`, formData)
      } else {
        await api.post(`/api/coloc/${colocId}/board`, {
          content: content.trim(),
          color,
          size,
          linkUrl: linkUrl.trim() || null,
          type: linkUrl.trim() ? 'link' : 'text',
        })
      }
      setContent('')
      setLinkUrl('')
      setSize('normal')
      clearImage()
      setShowForm(false)
      await loadItems()
    } catch (err) {
      console.error('Erreur création:', err)
    }
    setUploading(false)
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
    <div ref={dropRef} className="space-y-4 relative">
      {/* Drop overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 bg-accent/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-surface border-2 border-dashed border-accent rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-lg font-semibold text-accent">Dépose ton image ici</p>
            <p className="text-sm text-t-muted mt-1">Elle sera ajoutée comme post-it</p>
          </div>
        </div>
      )}

      {uploading && !showForm && (
        <div className="card p-3 text-center text-sm text-accent animate-pulse">
          Upload en cours...
        </div>
      )}

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
            {/* Toolbar de formatage */}
            <div className="flex items-center gap-1 border-b border-b pb-2">
              <button
                type="button"
                onClick={() => wrapSelection('**', '**')}
                className="px-2.5 py-1 text-xs font-bold text-t-muted rounded hover:bg-surface-hover transition"
                title="Gras"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection('*', '*')}
                className="px-2.5 py-1 text-xs italic text-t-muted rounded hover:bg-surface-hover transition"
                title="Italique"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertPrefix('- ')}
                className="px-2.5 py-1 text-xs text-t-muted rounded hover:bg-surface-hover transition"
                title="Liste"
              >
                ☰ Liste
              </button>
              <div className="w-px h-4 bg-b mx-1" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs text-t-muted rounded hover:bg-surface-hover transition"
                title="Ajouter une image"
              >
                📷 Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ecris ta note ici..."
              rows={3}
              className="w-full px-3 py-2 border border-b rounded-lg text-sm resize-none text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border border-b" />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            )}

            {!imageFile && (
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Lien (optionnel)"
                className="w-full px-3 py-2 border border-b rounded-lg text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}

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
                disabled={uploading}
                className="btn-glow px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50"
              >
                {uploading ? 'Upload...' : 'Publier'}
              </button>
              <button
                onClick={() => { setShowForm(false); clearImage() }}
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
