'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, CATEGORY_ICONS, ROOM_LABELS, DIFFICULTY_LABELS } from '@/lib/xp'

type Template = {
  id: string
  title: string
  description: string | null
  category: string
  room: string | null
  difficulty: string
  recurrence: string
  isActive: boolean
  isCustom?: boolean
  colocTemplateId: string | null
}

export default function QuestSetup({ colocId }: { colocId: string }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('cleaning')
  const [newRoom, setNewRoom] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('medium')
  const [newRecurrence, setNewRecurrence] = useState('weekly')

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/templates`)
      setTemplates(data.templates)
      setCustomTemplates(data.customTemplates)
    } catch (err) {
      console.error('Erreur chargement templates:', err)
    }
    setLoading(false)
  }

  async function toggleTemplate(templateId: string) {
    setToggling(templateId)
    try {
      await api.post(`/api/coloc/${colocId}/templates`, { templateId })
      await loadTemplates()
    } catch (err) {
      console.error('Erreur toggle:', err)
    }
    setToggling(null)
  }

  async function createCustom() {
    if (!newTitle.trim()) return
    try {
      await api.post(`/api/coloc/${colocId}/templates`, {
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        category: newCategory,
        room: newRoom || null,
        difficulty: newDifficulty,
        recurrence: newRecurrence,
      })
      setNewTitle('')
      setNewDesc('')
      setShowForm(false)
      await loadTemplates()
    } catch (err) {
      console.error('Erreur création:', err)
    }
  }

  async function deleteCustom(colocTemplateId: string) {
    try {
      await api.delete(`/api/coloc/${colocId}/templates`, { colocTemplateId })
      await loadTemplates()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const categories = ['all', 'cleaning', 'cooking', 'sport', 'maintenance', 'admin']
  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter)
  const activeCount = templates.filter((t) => t.isActive).length + customTemplates.filter((t) => t.isActive).length

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Configuration des quêtes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Active les tâches qui correspondent à ta maison · {activeCount} quêtes actives
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Quête custom
        </button>
      </div>

      {/* Formulaire quête custom */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Nouvelle quête personnalisée</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Arroser les plantes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optionnel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pièce</label>
              <select
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Aucune</option>
                {Object.entries(ROOM_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(DIFFICULTY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Récurrence</label>
              <select
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createCustom}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Créer
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

      {/* Quêtes custom */}
      {customTemplates.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Quêtes personnalisées</h3>
          <div className="space-y-2">
            {customTemplates.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-indigo-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[t.category] ?? '📌'}</span>
                  <div>
                    <p className="font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {CATEGORY_LABELS[t.category]} · {DIFFICULTY_LABELS[t.difficulty ?? 'medium']}
                      {t.room && ` · ${ROOM_LABELS[t.room]}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteCustom(t.colocTemplateId!)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtre par catégorie */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'Toutes' : `${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
          </button>
        ))}
      </div>

      {/* Liste des templates globaux */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between transition ${
              t.isActive ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{CATEGORY_ICONS[t.category] ?? '📌'}</span>
              <div>
                <p className={`font-medium ${t.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t.title}
                </p>
                {t.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {DIFFICULTY_LABELS[t.difficulty]} · {t.recurrence === 'daily' ? 'Quotidien' : t.recurrence === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}
                  {t.room && ` · ${ROOM_LABELS[t.room]}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleTemplate(t.id)}
              disabled={toggling === t.id}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                t.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  t.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
