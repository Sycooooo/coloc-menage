'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinColocPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/coloc/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code.trim() }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Code invalide')
      setLoading(false)
      return
    }

    const coloc = await res.json()
    router.push(`/coloc/${coloc.id}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">
          ← Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rejoindre une colocation</h1>
        <p className="text-gray-500 text-sm mb-6">
          Demande le code d&apos;invitation à un membre de la coloc.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code d&apos;invitation
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              placeholder="Colle le code ici"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Vérification...' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </main>
  )
}
