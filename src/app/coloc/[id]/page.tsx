import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import DashboardHub from '@/components/DashboardHub'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const userId = session.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const [coloc, lastMessages, nextEvent, latestMenu, user, pendingTasksCount, habitsData, expenses, boardCount] = await Promise.all([
    // Coloc + membres
    prisma.colocation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, username: true, avatar: true, rankPoints: true,
                spotifyAccount: { select: { id: true } },
              },
            },
          },
        },
      },
    }),

    // 5 derniers messages
    prisma.message.findMany({
      where: { colocId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { username: true } } },
    }),

    // Prochain événement
    prisma.calendarEvent.findFirst({
      where: { colocId: id, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
    }),

    // Menu de la semaine
    prisma.weeklyMenu.findFirst({
      where: { colocId: id },
      orderBy: { createdAt: 'desc' },
    }),

    // Profil user
    prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, currentStreak: true, rankPoints: true },
    }),

    // Tâches pending
    prisma.task.count({
      where: {
        colocId: id,
        status: 'pending',
        OR: [{ assignedToId: userId }, { assignedToId: null }],
      },
    }),

    // Habits aujourd'hui
    (async () => {
      const [total, completed] = await Promise.all([
        prisma.habit.count({ where: { userId, colocId: id, isActive: true } }),
        prisma.habitLog.count({
          where: { userId, habit: { colocId: id }, completed: true, date: { gte: today, lt: tomorrow } },
        }),
      ])
      return { total, completed }
    })(),

    // Dépenses pour balance
    prisma.expense.findMany({
      where: { colocId: id },
      include: { splits: true },
    }),

    // Board count
    prisma.boardItem.count({ where: { colocId: id } }),
  ])

  if (!coloc) notFound()
  const isMember = coloc.members.some((m) => m.userId === userId)
  if (!isMember) redirect('/')
  const isAdmin = coloc.members.find((m) => m.userId === userId)?.role === 'admin'

  // Calculer balance user
  let userBalance = 0
  for (const expense of expenses) {
    if (expense.paidById === userId) userBalance += expense.amount
    for (const split of expense.splits) {
      if (split.userId === userId) userBalance -= split.amount
    }
  }

  // Parser le repas du jour
  let todayMeal: { lunch: string | null; dinner: string | null } | null = null
  if (latestMenu) {
    try {
      const meals = JSON.parse(latestMenu.meals)
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      const todayName = dayNames[new Date().getDay()]
      if (Array.isArray(meals)) {
        const todayData = meals.find((d: { jour?: string }) => d.jour === todayName)
        if (todayData) {
          todayMeal = { lunch: todayData.dejeuner?.nom ?? null, dinner: todayData.diner?.nom ?? null }
        }
      } else if (meals[todayName]) {
        const d = meals[todayName]
        todayMeal = { lunch: d.dejeuner?.nom ?? null, dinner: d.diner?.nom ?? null }
      }
    } catch {}
  }

  const hasSpotify = !!coloc.members.find((m) => m.userId === userId)?.user.spotifyAccount

  return (
    <div className="min-h-screen relative z-10" data-room="salon">
      <PageAmbiance theme="salon" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PixelIcon name="home" size={24} className="text-blue-400" />
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/coloc/${id}/admin`}
              className="text-xs bg-accent/15 text-accent px-3 py-1.5 rounded-full font-medium hover:bg-accent/25 transition"
            >
              ⚙️
            </Link>
          )}
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <PageTransition>
          <DashboardHub
            colocId={id}
            colocName={coloc.name}
            currentUserId={userId}
            members={coloc.members.map((m) => ({
              userId: m.user.id,
              username: m.user.username,
              avatar: m.user.avatar,
              rankPoints: m.user.rankPoints,
            }))}
            lastMessages={lastMessages.reverse().map((m) => ({
              id: m.id,
              content: m.content,
              username: m.user.username,
              createdAt: m.createdAt.toISOString(),
              type: m.type,
            }))}
            nextEvent={nextEvent ? {
              title: nextEvent.title,
              startDate: nextEvent.startDate.toISOString(),
              color: nextEvent.color,
            } : null}
            todayMeal={todayMeal}
            userBalance={userBalance}
            boardCount={boardCount}
            userProfile={{
              xp: user?.xp ?? 0,
              currentStreak: user?.currentStreak ?? 0,
              rankPoints: user?.rankPoints ?? 0,
            }}
            pendingTasksCount={pendingTasksCount}
            habitsToday={habitsData}
            hasSpotify={hasSpotify}
          />
        </PageTransition>
      </main>
    </div>
  )
}
