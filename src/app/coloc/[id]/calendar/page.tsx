import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Calendar from '@/components/Calendar'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'

export default async function CalendarPage({
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
        <span className="text-xl">📅</span>
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">Calendrier — {coloc.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <PageTransition>
          <Calendar colocId={id} />
        </PageTransition>
      </main>
    </div>
  )
}
