'use client'

import Button from '@/components/ui/Button'

export default function HomeButtons() {
  return (
    <div className="flex gap-3">
      <Button variant="primary" size="lg" href="/login" className="btn-glow flex-1">
        Se connecter
      </Button>
      <Button variant="outline" size="lg" href="/register" className="backdrop-blur-sm flex-1">
        S&apos;inscrire
      </Button>
    </div>
  )
}
