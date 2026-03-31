import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { signOut } from '@/lib/auth'
import ThemeToggle from '@/components/ThemeToggle'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const colocs = await prisma.colocation.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { include: { user: { select: { id: true, username: true } } } },
      tasks: { where: { status: 'pending' } },
    },
  })

  return (
    <div className="min-h-screen bg-bg">
      {/* Header glass */}
      <header className="glass-header sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">THC App</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/profile" className="text-sm text-accent font-medium hover:text-accent-hover transition">
            👤 {session.user.name}
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button className="text-sm text-t-muted hover:text-t-primary transition">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl tracking-wide text-t-primary uppercase neon-title">Mes colocations</h2>
          <Link
            href="/coloc/new"
            className="btn-glow px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition"
          >
            + Nouvelle coloc
          </Link>
        </div>

        {colocs.length === 0 ? (
          <div className="card card-glow text-center py-16 px-6">
            <div className="text-5xl mb-4">🏡</div>
            <h3 className="text-lg font-semibold text-t-muted mb-2">
              Aucune colocation
            </h3>
            <p className="text-t-faint mb-6">
              Crée une colocation ou rejoins-en une avec un code d&apos;invitation.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/coloc/new"
                className="btn-glow px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition"
              >
                Créer une coloc
              </Link>
              <Link
                href="/coloc/join"
                className="px-5 py-2.5 border border-b text-t-muted rounded-lg font-medium hover:bg-surface-hover transition"
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
                className="card card-glow p-6 hover:border-accent/50 transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-t-primary mb-1 group-hover:text-accent transition">
                      {coloc.name}
                    </h3>
                    <p className="text-sm text-t-muted">
                      {coloc.members.length} colocataire{coloc.members.length > 1 ? 's' : ''} ·{' '}
                      <span className="stat-number">{coloc.tasks.length}</span> tâche{coloc.tasks.length > 1 ? 's' : ''} en attente
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {coloc.members.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="w-8 h-8 rounded-full bg-accent/20 border-2 border-surface flex items-center justify-center text-xs font-medium text-accent"
                      >
                        {m.user.username[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}

            <Link
              href="/coloc/join"
              className="card p-6 text-center text-t-muted border-dashed hover:border-accent/50 hover:text-accent transition"
              style={{ borderStyle: 'dashed' }}
            >
              + Rejoindre une colocation avec un code
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
