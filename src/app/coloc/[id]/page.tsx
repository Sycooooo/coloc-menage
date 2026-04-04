import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TaskList from '@/components/TaskList'
import AddTaskForm from '@/components/AddTaskForm'
import NotificationBell from '@/components/NotificationBell'
import { autoGenerateQuests } from '@/lib/quest-generator'
import { getRankFromPoints } from '@/lib/ranking'
import PageTransition from '@/components/PageTransition'
import InviteCode from '@/components/InviteCode'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import TabSwitcher from '@/components/TabSwitcher'

export default async function ColocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  // Auto-génération des quêtes (avant de charger les tâches)
  await autoGenerateQuests(id)

  const coloc = await prisma.colocation.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, avatar: true, hideStats: true, rankPoints: true } } },
      },
      tasks: {
        include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      },
      scores: {
        include: { user: { select: { id: true, username: true, hideStats: true } } },
        orderBy: { points: 'desc' },
      },
    },
  })

  if (!coloc) notFound()

  const userId = session.user!.id
  const isMember = coloc.members.some((m) => m.userId === userId)
  if (!isMember) redirect('/')

  const isAdmin = coloc.members.find((m) => m.userId === userId)?.role === 'admin'

  const hasActiveTemplates = await prisma.colocTemplate.count({
    where: { colocId: id, isActive: true },
  }) > 0

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
              ⚙️ Admin
            </Link>
          )}
          <NotificationBell />
        </div>
      </header>

      <TabSwitcher
        tabs={[
          { key: 'tasks', label: '📋 Tâches', href: `/coloc/${id}` },
          { key: 'habits', label: '🔥 Habitudes', href: `/coloc/${id}/habits` },
        ]}
        active="tasks"
      />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <PageTransition>
        {/* Code d'invitation */}
        <InviteCode code={coloc.inviteCode} />

        {/* Membres */}
        <div className="card card-glow p-5">
          <h2 className="font-semibold text-t-primary mb-3">Colocataires</h2>
          <div className="flex flex-wrap gap-3">
            {coloc.members.map((m) => {
              const memberRank = getRankFromPoints(m.user.rankPoints)
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                    {m.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-t-muted">{m.user.username}</span>
                  {!m.user.hideStats && (
                    <>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${memberRank.color}20`,
                          color: memberRank.color,
                        }}
                      >
                        {memberRank.icon} {memberRank.name}
                      </span>
                      {coloc.scores.find(s => s.userId === m.userId) && (
                        <span className="text-xs text-t-faint stat-number">
                          {coloc.scores.find(s => s.userId === m.userId)?.points} pts
                        </span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Classement compétitif */}
        <div className="card card-glow p-5" style={{ background: 'rgba(22, 22, 40, 0.75)' }}>
          <h2 className="font-semibold text-t-primary mb-4">Classement compétitif</h2>
          <div className="space-y-2">
            {[...coloc.members]
              .filter((m) => !m.user.hideStats)
              .sort((a, b) => b.user.rankPoints - a.user.rankPoints)
              .map((m, i) => {
                const rank = getRankFromPoints(m.user.rankPoints)
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition"
                    style={{
                      backgroundColor: i === 0 ? `${rank.color}10` : undefined,
                      border: i === 0 ? `1px solid ${rank.color}30` : '1px solid transparent',
                    }}
                  >
                    <span className="text-sm font-bold text-t-faint w-6 text-center">
                      {medal ?? `${i + 1}.`}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                      {m.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-t-primary flex-1">{m.user.username}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${rank.color}20`, color: rank.color }}
                    >
                      {rank.icon} {rank.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${rank.progressPercent}%`, backgroundColor: rank.color }}
                        />
                      </div>
                      <span className="text-xs text-t-faint tabular-nums">{rank.progressPercent}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Bandeau setup si pas encore configuré */}
        {isAdmin && !hasActiveTemplates && (
          <Link
            href={`/coloc/${id}/admin`}
            className="block bg-accent/10 border border-accent/20 rounded-xl p-4 hover:border-accent/40 transition"
          >
            <p className="font-semibold text-accent">Configure tes quêtes</p>
            <p className="text-xs text-t-muted mt-0.5">
              Active les tâches de ta maison dans l&apos;admin pour que les quêtes se génèrent automatiquement chaque jour.
            </p>
          </Link>
        )}

        {/* Ajouter une tâche */}
        <AddTaskForm
          colocId={coloc.id}
          members={coloc.members.map((m) => ({ id: m.user.id, name: m.user.username }))}
        />

        {/* Liste des tâches */}
        <TaskList
          tasks={coloc.tasks}
          currentUserId={userId}
          colocId={id}
        />
        </PageTransition>
      </main>
    </div>
  )
}
