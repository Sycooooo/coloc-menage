import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Expenses from '@/components/Expenses'
import NotificationBell from '@/components/NotificationBell'

export default async function ExpensesPage({
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
    },
  })

  if (!coloc) notFound()

  const isMember = coloc.members.some((m) => m.userId === session.user!.id)
  if (!isMember) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-100 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/coloc/${id}`} className="text-stone-500 hover:text-stone-600">
            ←
          </Link>
          <span className="text-xl">💰</span>
          <h1 className="text-xl font-bold text-stone-800">Dépenses</h1>
        </div>
        <NotificationBell />
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <Expenses colocId={id} currentUserId={session.user!.id} />
      </main>
    </div>
  )
}
