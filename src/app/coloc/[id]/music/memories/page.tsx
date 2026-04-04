import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import PageTransition from '@/components/PageTransition'
import MusicMemories from '@/components/music/MusicMemories'

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const coloc = await prisma.colocation.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!coloc) notFound()

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId: id } },
  })
  if (!membership) redirect('/')

  // Toutes les stories (pas seulement les actives)
  const stories = await prisma.musicStory.findMany({
    where: { colocId: id },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen relative z-10" data-room="studio">
      <PageAmbiance theme="studio" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}/music`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <PixelIcon name="music" size={24} className="text-pink-400" />
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">Memories</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <PageTransition>
          <MusicMemories
            stories={stories.map((s) => ({
              id: s.id,
              trackName: s.trackName,
              artistName: s.artistName,
              albumArt: s.albumArt,
              spotifyUrl: s.spotifyUrl,
              caption: s.caption,
              createdAt: s.createdAt.toISOString(),
              username: s.user.username,
            }))}
          />
        </PageTransition>
      </main>
    </div>
  )
}
