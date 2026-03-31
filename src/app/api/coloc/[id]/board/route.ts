import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyColoc } from '@/lib/notifications'

export async function GET(
  _request: Request,
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

  const items = await prisma.boardItem.findMany({
    where: { colocId },
    include: { createdBy: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(items)
}

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
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
  }

  const item = await prisma.boardItem.create({
    data: {
      content: body.content.trim(),
      type: body.type || 'text',
      color: body.color || 'yellow',
      linkUrl: body.linkUrl || null,
      colocId,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, username: true } } },
  })

  await notifyColoc(
    colocId,
    session.user.id,
    'new_board_item',
    `${item.createdBy.username} a ajouté un post-it sur le tableau`,
    `/coloc/${colocId}/board`
  )

  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(
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

  const { itemId } = await request.json()

  await prisma.boardItem.delete({
    where: { id: itemId, colocId },
  })

  return NextResponse.json({ success: true })
}
