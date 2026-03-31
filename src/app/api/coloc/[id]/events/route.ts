import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyColoc } from '@/lib/notifications'

// GET — Récupérer les événements d'une coloc (filtrés par mois)
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
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth()))

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Récupérer les events du mois (avec marge pour afficher les events qui débordent)
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const events = await prisma.calendarEvent.findMany({
    where: {
      colocId,
      startDate: { lte: end },
      OR: [
        { endDate: { gte: start } },
        { endDate: null, startDate: { gte: start } },
      ],
    },
    include: { createdBy: { select: { id: true, username: true } } },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json(events)
}

// POST — Créer un événement
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
  if (!body.title || !body.startDate) {
    return NextResponse.json({ error: 'Titre et date requis' }, { status: 400 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: body.title,
      description: body.description || null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      allDay: body.allDay ?? false,
      color: body.color || 'indigo',
      colocId,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, username: true } } },
  })

  await notifyColoc(
    colocId,
    session.user.id,
    'new_event',
    `${event.createdBy.username} a ajouté "${body.title}" au calendrier`,
    `/coloc/${colocId}/calendar`
  )

  return NextResponse.json(event, { status: 201 })
}

// DELETE — Supprimer un événement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId } = await params
  const { eventId } = await request.json()

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.calendarEvent.delete({
    where: { id: eventId, colocId },
  })

  return NextResponse.json({ success: true })
}
