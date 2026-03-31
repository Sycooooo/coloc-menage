import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Board from '@/components/Board'

export default async function BoardPage({
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
  if (!membership) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}`} className="text-gray-500 hover:text-gray-700">
          ←
        </Link>
        <span className="text-xl">📌</span>
        <h1 className="text-xl font-bold text-gray-900">Tableau — {coloc.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Board colocId={id} currentUserId={session.user.id} />
      </main>
    </div>
  )
}
