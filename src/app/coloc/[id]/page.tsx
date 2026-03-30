import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TaskList from '@/components/TaskList'
import AddTaskForm from '@/components/AddTaskForm'
import GenerateQuests from '@/components/GenerateQuests'

export default async function ColocPage({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ←
          </Link>
          <span className="text-xl">🏠</span>
          <h1 className="text-xl font-bold text-gray-900">{coloc.name}</h1>
        </div>
        {isAdmin && (
          <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
            Admin
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Code d'invitation */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-700">Code d&apos;invitation</p>
            <p className="font-mono text-indigo-900 text-sm mt-0.5">{coloc.inviteCode}</p>
          </div>
          <p className="text-xs text-indigo-500">Partage ce code pour inviter des colocataires</p>
        </div>

        {/* Membres */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Colocataires</h2>
          <div className="flex flex-wrap gap-3">
            {coloc.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                  {m.user.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{m.user.username}</span>
                {coloc.scores.find(s => s.userId === m.userId) && (
                  <span className="text-xs text-gray-400">
                    {coloc.scores.find(s => s.userId === m.userId)?.points} pts
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Générer des quêtes (admin seulement) */}
        {isAdmin && <GenerateQuests colocId={coloc.id} />}

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
