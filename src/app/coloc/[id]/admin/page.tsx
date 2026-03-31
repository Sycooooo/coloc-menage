import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import QuestSetup from '@/components/QuestSetup'
import AffinitySetup from '@/components/AffinitySetup'

export default async function AdminPage({
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
        include: { user: { select: { id: true, username: true } } },
      },
    },
  })

  if (!coloc) notFound()

  const userId = session.user.id
  const member = coloc.members.find((m) => m.userId === userId)
  if (!member) redirect('/dashboard')
  if (member.role !== 'admin') redirect(`/coloc/${id}`)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/coloc/${id}`} className="text-gray-500 hover:text-gray-700">
            ←
          </Link>
          <span className="text-xl">⚙️</span>
          <h1 className="text-xl font-bold text-gray-900">Admin — {coloc.name}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Section 1 : Configuration des quêtes */}
        <QuestSetup colocId={id} />

        {/* Section 2 : Affinités des membres */}
        <AffinitySetup
          colocId={id}
          members={coloc.members.map((m) => ({ id: m.user.id, name: m.user.username }))}
        />
      </main>
    </div>
  )
}
