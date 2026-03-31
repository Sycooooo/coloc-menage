import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TaskList from '@/components/TaskList'
import AddTaskForm from '@/components/AddTaskForm'
import NotificationBell from '@/components/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'
import { autoGenerateQuests } from '@/lib/quest-generator'

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
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
      tasks: {
        include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      },
      scores: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { points: 'desc' },
      },
    },
  })

  if (!coloc) notFound()

  const userId = session.user!.id
  const isMember = coloc.members.some((m) => m.userId === userId)
  if (!isMember) redirect('/dashboard')

  const isAdmin = coloc.members.find((m) => m.userId === userId)?.role === 'admin'

  const hasActiveTemplates = await prisma.colocTemplate.count({
    where: { colocId: id, isActive: true },
  }) > 0

  return (
    <div className="min-h-screen bg-bg">
      <header className="glass-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-t-muted hover:text-t-primary transition">
            ←
          </Link>
          <span className="text-xl">🏠</span>
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/coloc/${id}/calendar`}
            className="text-xs bg-surface-hover text-t-muted px-3 py-1.5 rounded-full font-medium hover:text-t-primary transition"
          >
            📅 Calendrier
          </Link>
          <Link
            href={`/coloc/${id}/board`}
            className="text-xs bg-surface-hover text-t-muted px-3 py-1.5 rounded-full font-medium hover:text-t-primary transition"
          >
            📌 Tableau
          </Link>
          <Link
            href={`/coloc/${id}/chat`}
            className="text-xs bg-surface-hover text-t-muted px-3 py-1.5 rounded-full font-medium hover:text-t-primary transition"
          >
            💬 Chat
          </Link>
          <Link
            href={`/coloc/${id}/menu`}
            className="text-xs bg-surface-hover text-t-muted px-3 py-1.5 rounded-full font-medium hover:text-t-primary transition"
          >
            🍽️ Menu
          </Link>
          <Link
            href={`/coloc/${id}/expenses`}
            className="text-xs bg-surface-hover text-t-muted px-3 py-1.5 rounded-full font-medium hover:text-t-primary transition"
          >
            💰 Dépenses
          </Link>
          {isAdmin && (
            <Link
              href={`/coloc/${id}/admin`}
              className="text-xs bg-accent/15 text-accent px-3 py-1.5 rounded-full font-medium hover:bg-accent/25 transition"
            >
              ⚙️ Admin
            </Link>
          )}
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Code d'invitation */}
        <div className="bg-accent-secondary/10 border border-accent-secondary/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-accent-secondary">Code d&apos;invitation</p>
            <p className="code-text text-t-primary text-sm mt-0.5">{coloc.inviteCode}</p>
          </div>
          <p className="text-xs text-t-muted">Partage ce code pour inviter des colocataires</p>
        </div>

        {/* Membres */}
        <div className="card card-glow p-5">
          <h2 className="font-semibold text-t-primary mb-3">Colocataires</h2>
          <div className="flex flex-wrap gap-3">
            {coloc.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                  {m.user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-t-muted">{m.user.username}</span>
                {coloc.scores.find(s => s.userId === m.userId) && (
                  <span className="text-xs text-t-faint stat-number">
                    {coloc.scores.find(s => s.userId === m.userId)?.points} pts
                  </span>
                )}
              </div>
            ))}
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
        />
      </main>
    </div>
  )
}
