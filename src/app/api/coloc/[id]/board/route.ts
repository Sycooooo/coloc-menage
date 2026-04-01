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
    orderBy: { position: 'asc' },
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

  // Calculate next position
  const maxPos = await prisma.boardItem.aggregate({
    where: { colocId },
    _max: { position: true },
  })
  const nextPosition = (maxPos._max.position ?? -1) + 1

  const item = await prisma.boardItem.create({
    data: {
      content: body.content.trim(),
      type: body.type || 'text',
      color: body.color || 'yellow',
      size: body.size || 'normal',
      linkUrl: body.linkUrl || null,
      position: nextPosition,
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

export async function PATCH(
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

  if (body.action === 'reorder') {
    // Reorder: receive items array with {id, position}
    const items = body.items as { id: string; position: number }[]
    if (!items?.length) {
      return NextResponse.json({ error: 'Items requis' }, { status: 400 })
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.boardItem.update({
          where: { id: item.id, colocId },
          data: { position: item.position },
        })
      )
    )

    return NextResponse.json({ success: true })
  }

  // Default: edit a note
  const { itemId, content, color, size, linkUrl, type } = body
  if (!itemId) {
    return NextResponse.json({ error: 'itemId requis' }, { status: 400 })
  }

  const updated = await prisma.boardItem.update({
    where: { id: itemId, colocId },
    data: {
      ...(content !== undefined && { content: content.trim() }),
      ...(color !== undefined && { color }),
      ...(size !== undefined && { size }),
      ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
      ...(type !== undefined && { type }),
    },
    include: { createdBy: { select: { id: true, username: true } } },
  })

  return NextResponse.json(updated)
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
