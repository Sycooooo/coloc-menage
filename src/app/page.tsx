import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HomeButtons from './HomeButtons'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import RainOverlay from '@/components/ui/RainOverlay'

export default async function Home() {
  const session = await auth()

  if (session?.user?.id) {
    const membership = await prisma.userColoc.findFirst({
      where: { userId: session.user.id },
    })
    if (membership) {
      redirect(`/coloc/${membership.colocId}`)
    } else {
      redirect('/coloc/new')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <PageAmbiance theme="accueil" opacity={0.85} />
      <RainOverlay />

      <div className="w-full max-w-sm rounded-2xl bg-[#0a0a14]/75 backdrop-blur-2xl border border-accent/10 p-8 text-center">
        <PixelIcon name="home" size={40} className="text-accent mx-auto mb-4" />
        <h1 className="neon-title mb-1">
          <span className="font-pixel text-xl text-accent">THC</span>
          <span className="font-display text-5xl tracking-wide text-t-primary uppercase ml-2">App</span>
        </h1>
        <p className="font-pixel text-[8px] text-t-faint/50 mb-4 tracking-wider">
          Coloc &middot; Gamification &middot; Pixel Art
        </p>
        <p className="text-t-muted text-sm mb-6">
          Gérez votre coloc comme un jeu.
        </p>
        <HomeButtons />
      </div>
    </main>
  )
}
