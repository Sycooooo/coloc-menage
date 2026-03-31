'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type BoardItem = {
  id: string
  content: string
  type: string
  color: string
  linkUrl: string | null
  createdAt: string
  createdBy: { id: string; username: string }
}

const NOTE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
}

export default function Board({ colocId, currentUserId }: { colocId: string; currentUserId: string }) {
  const [items, setItems] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [content, setContent] = useState('')
  const [color, setColor] = useState('yellow')
  const [linkUrl, setLinkUrl] = useState('')

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
        linkUrl: linkUrl.trim() || null,
        type: linkUrl.trim() ? 'link' : 'text',
      })
      setContent('')
      setLinkUrl('')
      setShowForm(false)
      await loadItems()
    } catch (err) {
      console.error('Erreur création:', err)
    }
  }

  async function deleteItem(itemId: string) {
    try {
      await api.delete(`/api/coloc/${colocId}/board`, { itemId })
      await loadItems()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} note{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Ajouter une note
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ecris ta note ici..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Lien (optionnel)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Couleur :</span>
            {Object.keys(NOTE_COLORS).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg ${NOTE_COLORS[c].bg} ${NOTE_COLORS[c].border} border-2 ${
                  color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={createItem}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Publier
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Grille de post-its */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Aucune note pour l&apos;instant. Ajoute la première !
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const colors = NOTE_COLORS[item.color] || NOTE_COLORS.yellow
            return (
              <div
                key={item.id}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-sm relative group`}
              >
                {/* Bouton supprimer */}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition text-xs"
                >
                  ✕
                </button>

                <p className={`text-sm whitespace-pre-wrap break-words ${colors.text}`}>
                  {item.content}
                </p>

                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline mt-2 block truncate"
                  >
                    {item.linkUrl}
                  </a>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    {item.createdBy.username}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
