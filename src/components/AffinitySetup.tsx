'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/xp'

type Member = { id: string; name: string }
type Affinity = { userId: string; category: string; weight: number }

const WEIGHTS = [
  { value: 0, label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  { value: 1, label: '+', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: '++', color: 'bg-indigo-100 text-indigo-700' },
  { value: 3, label: '+++', color: 'bg-purple-100 text-purple-700' },
]

export default function AffinitySetup({
  colocId,
  members,
}: {
  colocId: string
  members: Member[]
}) {
  const [affinities, setAffinities] = useState<Affinity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    loadAffinities()
  }, [])

  async function loadAffinities() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/affinities`)
      setAffinities(data)
    } catch (err) {
      console.error('Erreur chargement affinités:', err)
    }
    setLoading(false)
  }

  async function setAffinity(userId: string, category: string, weight: number) {
    const key = `${userId}-${category}`
    setSaving(key)
    try {
      await api.post(`/api/coloc/${colocId}/affinities`, { userId, category, weight })
      await loadAffinities()
    } catch (err) {
      console.error('Erreur affinité:', err)
    }
    setSaving(null)
  }

  function getWeight(userId: string, category: string): number {
    return affinities.find((a) => a.userId === userId && a.category === category)?.weight ?? 0
  }

  const categories = Object.keys(CATEGORY_LABELS)

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Chargement...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Affinités des membres</h2>
        <p className="text-sm text-gray-500 mt-1">
          Définis qui préfère faire quoi. Plus le poids est élevé, plus souvent cette personne recevra ces tâches.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Membre</th>
                {categories.map((cat) => (
                  <th key={cat} className="text-center px-3 py-3 font-medium text-gray-700">
                    <span className="block">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-xs">{CATEGORY_LABELS[cat]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                  {categories.map((cat) => {
                    const w = getWeight(member.id, cat)
                    const key = `${member.id}-${cat}`
                    const nextWeight = (w + 1) % 4
                    const style = WEIGHTS[w]
                    return (
                      <td key={cat} className="text-center px-3 py-3">
                        <button
                          onClick={() => setAffinity(member.id, cat, nextWeight)}
                          disabled={saving === key}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition disabled:opacity-50 ${style.color}`}
                        >
                          {saving === key ? '...' : style.label}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Clique sur un bouton pour changer le poids. Normal = pas de préférence, +++ = forte préférence.
      </p>
    </div>
  )
}
