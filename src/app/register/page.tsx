'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import PageAmbiance from '@/components/ui/PageAmbiance'
import RainOverlay from '@/components/ui/RainOverlay'
import PixelIcon from '@/components/ui/PixelIcon'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/api/auth/register', { username, password })
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <PageAmbiance theme="accueil" opacity={0.85} />
      <RainOverlay />

      <div className="w-full max-w-sm rounded-2xl bg-[#0a0a14]/75 backdrop-blur-2xl border border-accent/10 p-8">
        <div className="flex items-center gap-3 mb-6">
          <PixelIcon name="home" size={28} className="text-accent" />
          <h1 className="neon-title">
            <span className="font-pixel text-lg text-accent">THC</span>
            <span className="font-display text-3xl tracking-wide text-t-primary uppercase ml-2">Inscription</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-t-muted mb-1">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
              placeholder="choisis un pseudo"
            />
            <p className="text-xs text-t-faint mt-1">3 caractères minimum</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-t-muted mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-t-primary bg-input-bg"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <Button type="submit" disabled={loading} loading={loading} fullWidth>
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-t-muted mt-5">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
