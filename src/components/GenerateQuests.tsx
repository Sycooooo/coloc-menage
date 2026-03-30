'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function GenerateQuests({ colocId }: { colocId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    try {
      const data = await api.post(`/api/coloc/${colocId}/generate-quests`)
      setResult(data.message)
      setTimeout(() => {
        setResult(null)
        router.refresh()
      }, 2000)
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Erreur')
    }
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-indigo-900">Quêtes de la semaine</p>
        <p className="text-xs text-indigo-600 mt-0.5">
          Génère automatiquement des tâches pour tous les colocataires
        </p>
      </div>
      <div className="flex items-center gap-3">
        {result && (
          <span className="text-sm text-indigo-700 font-medium">{result}</span>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? 'Génération...' : '⚔️ Générer'}
        </button>
      </div>
    </div>
  )
}
