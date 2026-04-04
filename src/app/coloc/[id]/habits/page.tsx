import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HabitTracker from '@/components/HabitTracker'
import TabSwitcher from '@/components/TabSwitcher'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import NotificationBell from '@/components/NotificationBell'

export default async function HabitsPage({
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

  // Semaine courante (lundi → dimanche)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, colocId: id, isActive: true },
    orderBy: [{ block: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    include: {
      logs: {
        where: {
          userId: session.user.id,
          date: { gte: monday, lt: sunday },
          completed: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen relative z-10" data-room="bureau">
      <PageAmbiance theme="bureau" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
            ←
          </Link>
          <PixelIcon name="habits" size={24} className="text-orange-400" />
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name}</h1>
        </div>
      </header>

      <TabSwitcher
        tabs={[
          { key: 'tasks', label: '📋 Tâches', href: `/coloc/${id}/tasks` },
          { key: 'habits', label: '🔥 Habitudes', href: `/coloc/${id}/habits` },
        ]}
        active="habits"
      />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <PageTransition>
          <HabitTracker
            habits={habits.map((h) => ({
              id: h.id,
              title: h.title,
              description: h.description,
              icon: h.icon,
              difficulty: h.difficulty,
              block: h.block,
              logs: h.logs.map((l) => ({
                id: l.id,
                date: l.date.toISOString(),
                completed: l.completed,
              })),
            }))}
            colocId={id}
          />
        </PageTransition>
      </main>
    </div>
  )
}
