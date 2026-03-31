import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Chat from '@/components/Chat'

export default async function ChatPage({
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

  // Charger les 50 derniers messages
  const messages = await prisma.message.findMany({
    where: { colocId: id },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-surface border-b border-b px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <span className="text-xl">💬</span>
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase">{coloc.name} — Chat</h1>
      </header>

      <Chat
        colocId={id}
        currentUserId={session.user.id}
        initialMessages={messages.reverse().map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
