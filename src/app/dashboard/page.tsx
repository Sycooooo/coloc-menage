import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const colocs = await prisma.colocation.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      tasks: { where: { status: 'pending' } },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <h1 className="text-xl font-bold text-gray-900">Coloc Ménage</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Bonjour, {session.user.name}</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mes colocations</h2>
          <Link
            href="/coloc/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Nouvelle coloc
          </Link>
        </div>

        {colocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">🏡</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Aucune colocation
            </h3>
            <p className="text-gray-500 mb-6">
              Crée une colocation ou rejoins-en une avec un code d&apos;invitation.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/coloc/new"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Créer une coloc
              </Link>
              <Link
                href="/coloc/join"
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Rejoindre avec un code
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {colocs.map((coloc) => (
              <Link
                key={coloc.id}
                href={`/coloc/${coloc.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {coloc.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {coloc.members.length} colocataire{coloc.members.length > 1 ? 's' : ''} ·{' '}
                      {coloc.tasks.length} tâche{coloc.tasks.length > 1 ? 's' : ''} en attente
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {coloc.members.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-medium text-indigo-700"
                      >
                        {m.user.name[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}

            <Link
              href="/coloc/join"
              className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
            >
              + Rejoindre une colocation avec un code
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
