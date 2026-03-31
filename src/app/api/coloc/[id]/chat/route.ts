import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusher } from '@/lib/pusher'

// GET — Charger l'historique des messages (50 derniers, pagination avec ?before=)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId } = await params
  const { searchParams } = new URL(request.url)
  const before = searchParams.get('before')

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const messages = await prisma.message.findMany({
    where: {
      colocId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(messages.reverse())
}

// POST — Envoyer un message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId } = await params

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.content?.trim() && !body.imageUrl) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      content: body.content?.trim() || '',
      type: body.type || 'text',
      imageUrl: body.imageUrl || null,
      userId: session.user.id,
      colocId,
    },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  })

  // Envoyer en temps réel via Pusher
  await pusher.trigger(`coloc-${colocId}`, 'new-message', message)

  return NextResponse.json(message, { status: 201 })
}
