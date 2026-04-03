import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'
import MusicStories from '@/components/music/MusicStories'
import NowPlaying from '@/components/music/NowPlaying'
import TopArtists from '@/components/music/TopArtists'
import StoryHistory from '@/components/music/StoryHistory'

export default async function MusicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const coloc = await prisma.colocation.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              spotifyAccount: { select: { id: true } },
            },
          },
        },
      },
    },
  })

  if (!coloc) notFound()

  const userId = session.user.id
  const member = coloc.members.find((m) => m.userId === userId)
  if (!member) redirect('/')

  const hasSpotify = !!member.user.spotifyAccount

  const membersForNowPlaying = coloc.members.map((m) => ({
    id: m.user.id,
    username: m.user.username,
    hasSpotify: !!m.user.spotifyAccount,
  }))

  return (
    <div className="min-h-screen pb-20 relative z-10" data-room="studio">
      <PageAmbiance theme="studio" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
            ←
          </Link>
          <span className="text-xl">🎵</span>
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">Music</h1>
        </div>
        {!hasSpotify && (
          <Link
            href="/profile/settings"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 transition"
          >
            Connecter Spotify
          </Link>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <PageTransition>
          {/* Stories */}
          <MusicStories colocId={id} currentUserId={userId} hasSpotify={hasSpotify} />

          {/* En ecoute */}
          <NowPlaying colocId={id} currentUserId={userId} members={membersForNowPlaying} hasSpotify={hasSpotify} />

          {/* Historique stories */}
          <StoryHistory colocId={id} />

          {/* Top Artistes */}
          <TopArtists colocId={id} />
        </PageTransition>
      </main>
    </div>
  )
}
