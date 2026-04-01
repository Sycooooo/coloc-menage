import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Expenses from '@/components/Expenses'
import NotificationBell from '@/components/NotificationBell'
import PageTransition from '@/components/PageTransition'

export default async function ExpensesPage({
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
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
    },
  })

  if (!coloc) notFound()

  const isMember = coloc.members.some((m) => m.userId === session.user!.id)
  if (!isMember) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg">
      <header className="glass-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
            ←
          </Link>
          <span className="text-xl">💰</span>
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">Dépenses</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <PageTransition>
          <Expenses colocId={id} currentUserId={session.user!.id} />
        </PageTransition>
      </main>
    </div>
  )
}
