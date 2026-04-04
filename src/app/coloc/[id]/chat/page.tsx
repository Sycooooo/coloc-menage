import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Chat from '@/components/Chat'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'
import TabSwitcher from '@/components/TabSwitcher'

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
    select: {
      id: true,
      name: true,
      members: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
  })
  if (!coloc) notFound()

  const membership = coloc.members.find((m) => m.userId === session.user!.id)
  if (!membership) redirect('/')

  // Charger les 50 derniers messages
  const messages = await prisma.message.findMany({
    where: { colocId: id },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const members = coloc.members.map((m) => ({
    id: m.user.id,
    username: m.user.username,
  }))

  return (
    <div className="h-dvh flex flex-col relative z-10 overflow-hidden" data-room="chambre">
      <PageAmbiance theme="chambre" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <PixelIcon name="chat" size={24} className="text-accent" />
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name}</h1>
      </header>
      <TabSwitcher
        tabs={[
          { key: 'chat', label: '💬 Chat', href: `/coloc/${id}/chat` },
          { key: 'board', label: '📌 Tableau', href: `/coloc/${id}/board` },
        ]}
        active="chat"
      />

      <Chat
        colocId={id}
        currentUserId={session.user.id}
        members={members}
        initialMessages={messages.reverse().map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
