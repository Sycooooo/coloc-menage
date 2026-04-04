import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Board from '@/components/Board'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import TabSwitcher from '@/components/TabSwitcher'

export default async function BoardPage({
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

  return (
    <div className="min-h-screen relative z-10" data-room="bureau">
      <PageAmbiance theme="bureau" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <PixelIcon name="board" size={24} className="text-rose-400" />
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name}</h1>
      </header>
      <TabSwitcher
        tabs={[
          { key: 'chat', label: '💬 Chat', href: `/coloc/${id}/chat` },
          { key: 'board', label: '📌 Tableau', href: `/coloc/${id}/board` },
        ]}
        active="board"
      />

      <main className="max-w-4xl mx-auto p-6">
        <PageTransition>
          <Board colocId={id} currentUserId={session.user.id} />
        </PageTransition>
      </main>
    </div>
  )
}
