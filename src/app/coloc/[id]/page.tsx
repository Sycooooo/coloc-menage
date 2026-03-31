import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TaskList from '@/components/TaskList'
import AddTaskForm from '@/components/AddTaskForm'
import NotificationBell from '@/components/NotificationBell'
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
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-100 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-stone-500 hover:text-stone-600">
            ←
          </Link>
          <span className="text-xl">🏠</span>
          <h1 className="text-xl font-bold text-stone-800">{coloc.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/coloc/${id}/calendar`}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium hover:bg-stone-200 transition"
          >
            📅 Calendrier
          </Link>
          <Link
            href={`/coloc/${id}/board`}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium hover:bg-stone-200 transition"
          >
            📌 Tableau
          </Link>
          <Link
            href={`/coloc/${id}/chat`}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium hover:bg-stone-200 transition"
          >
            💬 Chat
          </Link>
          <Link
            href={`/coloc/${id}/menu`}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium hover:bg-stone-200 transition"
          >
            🍽️ Menu
          </Link>
          <Link
            href={`/coloc/${id}/expenses`}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium hover:bg-stone-200 transition"
          >
            💰 Dépenses
          </Link>
          {isAdmin && (
            <Link
              href={`/coloc/${id}/admin`}
              className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium hover:bg-amber-200 transition"
            >
              ⚙️ Admin
            </Link>
          )}
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Code d'invitation */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Code d&apos;invitation</p>
            <p className="font-mono text-amber-900 text-sm mt-0.5">{coloc.inviteCode}</p>
          </div>
          <p className="text-xs text-amber-600">Partage ce code pour inviter des colocataires</p>
        </div>

        {/* Membres */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-800 mb-3">Colocataires</h2>
          <div className="flex flex-wrap gap-3">
            {coloc.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800">
                  {m.user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-stone-600">{m.user.username}</span>
                {coloc.scores.find(s => s.userId === m.userId) && (
                  <span className="text-xs text-stone-400">
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
            className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:border-amber-300 transition"
          >
            <p className="font-semibold text-amber-900">Configure tes quêtes</p>
            <p className="text-xs text-amber-600 mt-0.5">
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
