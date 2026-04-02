'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { renderMiniMarkdown } from '@/lib/markdown'

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

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-500/15 dark:bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-900 dark:text-yellow-200' },
  pink: { bg: 'bg-pink-500/15 dark:bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-900 dark:text-pink-200' },
  blue: { bg: 'bg-blue-500/15 dark:bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-900 dark:text-blue-200' },
  green: { bg: 'bg-green-500/15 dark:bg-green-500/20', border: 'border-green-500/30', text: 'text-green-900 dark:text-green-200' },
  purple: { bg: 'bg-purple-500/15 dark:bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-900 dark:text-purple-200' },
  orange: { bg: 'bg-orange-500/15 dark:bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-900 dark:text-orange-200' },
  teal: { bg: 'bg-teal-500/15 dark:bg-teal-500/20', border: 'border-teal-500/30', text: 'text-teal-900 dark:text-teal-200' },
  red: { bg: 'bg-red-500/15 dark:bg-red-500/20', border: 'border-red-500/30', text: 'text-red-900 dark:text-red-200' },
}

export { NOTE_COLORS }

function FormatToolbar({
  textareaRef,
  onContentChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (value: string) => void
}) {
  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = ta.value
    const selected = text.substring(start, end)
    const newText = text.substring(0, start) + before + selected + after + text.substring(end)
    onContentChange(newText)
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
    onContentChange(newText)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + prefix.length
    }, 0)
  }

  return (
    <div className="flex items-center gap-1 border-b border-current/10 pb-1.5 mb-1">
      <button
        type="button"
        onClick={() => wrapSelection('**', '**')}
        className="px-2 py-0.5 text-xs font-bold rounded hover:bg-white/10 transition"
        title="Gras"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => wrapSelection('*', '*')}
        className="px-2 py-0.5 text-xs italic rounded hover:bg-white/10 transition"
        title="Italique"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => insertPrefix('- ')}
        className="px-2 py-0.5 text-xs rounded hover:bg-white/10 transition"
        title="Liste"
      >
        ☰
      </button>
    </div>
  )
}

export default function BoardNote({
  item,
  onDelete,
  onEdit,
  isDragging,
}: {
  item: BoardItem
  onDelete: (id: string) => void
  onEdit: (id: string, data: { content?: string; color?: string; size?: string; linkUrl?: string }) => void
  isDragging?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(item.content)
  const [editColor, setEditColor] = useState(item.color)
  const [editLink, setEditLink] = useState(item.linkUrl || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const colors = NOTE_COLORS[item.color] || NOTE_COLORS.yellow

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [editing])

  function handleSave() {
    const changes: Record<string, string> = {}
    if (editContent.trim() !== item.content) changes.content = editContent.trim()
    if (editColor !== item.color) changes.color = editColor
    if (editLink !== (item.linkUrl || '')) changes.linkUrl = editLink
    if (Object.keys(changes).length > 0) {
      onEdit(item.id, changes)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setEditContent(item.content)
      setEditColor(item.color)
      setEditLink(item.linkUrl || '')
      setEditing(false)
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!isDragging}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      whileHover={!editing ? { scale: 1.02, rotate: 0.5 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`${colors.bg} ${colors.border} border rounded-lg backdrop-blur-sm p-4 relative group ${
        item.size === 'large' ? 'col-span-2' : ''
      } ${isDragging ? 'z-50 shadow-2xl opacity-80' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 text-t-faint hover:text-t-muted opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing text-sm"
        title="Glisser pour déplacer"
      >
        ⠿
      </button>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-t-faint hover:text-accent text-xs p-0.5"
            title="Modifier"
          >
            ✎
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="text-t-faint hover:text-danger text-xs p-0.5"
          title="Supprimer"
        >
          ✕
        </button>
      </div>

      {editing ? (
        <div className="space-y-2 pt-4" onKeyDown={handleKeyDown}>
          <FormatToolbar textareaRef={textareaRef} onContentChange={setEditContent} />
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className={`w-full bg-transparent border-none resize-none text-sm focus:outline-none ${colors.text}`}
            placeholder="Contenu du post-it..."
          />
          <input
            type="url"
            value={editLink}
            onChange={(e) => setEditLink(e.target.value)}
            placeholder="Lien (optionnel)"
            className="w-full bg-transparent border-b border-current/20 text-xs text-t-muted focus:outline-none pb-1"
          />
          {/* Color picker inline */}
          <div className="flex items-center gap-1.5">
            {Object.keys(NOTE_COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setEditColor(c)}
                className={`w-5 h-5 rounded-full ${NOTE_COLORS[c].bg} ${NOTE_COLORS[c].border} border ${
                  editColor === c ? 'ring-2 ring-offset-1 ring-accent/50' : ''
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-t-faint">Ctrl+Enter pour sauver · Echap pour annuler</p>
            <div className="flex gap-1">
              <button
                onClick={() => { setEditing(false); setEditContent(item.content); setEditColor(item.color); setEditLink(item.linkUrl || '') }}
                className="text-[10px] text-t-faint hover:text-t-muted px-2 py-0.5 rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="text-[10px] text-accent font-medium px-2 py-0.5 rounded hover:bg-accent/10"
              >
                Sauver
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Image */}
          {item.type === 'image' && item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.content}
              className="w-full rounded-lg mt-3 cursor-pointer"
              onClick={() => setEditing(true)}
            />
          )}

          {/* Rendered content */}
          <div
            className={`text-sm whitespace-pre-wrap break-words ${item.type === 'image' ? 'mt-2' : 'pt-3'} ${colors.text} cursor-pointer`}
            onClick={() => setEditing(true)}
            dangerouslySetInnerHTML={{ __html: renderMiniMarkdown(item.content) }}
          />

          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline mt-2 block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {item.linkUrl}
            </a>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-t-muted">
              {item.createdBy.username}
            </span>
            <span className="text-[10px] text-t-faint">
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </>
      )}
    </motion.div>
  )
}
