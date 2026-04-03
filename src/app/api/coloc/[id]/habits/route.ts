import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createHabitSchema } from '@/lib/validations'

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

  // Semaine courante (lundi → dimanche)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id, colocId, isActive: true },
    orderBy: [{ block: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    include: {
      logs: {
        where: {
          userId: session.user.id,
          date: { gte: monday, lt: sunday },
          completed: true,
        },
      },
    },
  })

  return NextResponse.json(habits)
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
  const result = createHabitSchema.safeParse({ ...body, colocId })
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { title, description, icon, difficulty, block } = result.data

  // Calculer le prochain order dans ce bloc
  const maxOrder = await prisma.habit.aggregate({
    where: { userId: session.user.id, colocId, block },
    _max: { order: true },
  })

  const habit = await prisma.habit.create({
    data: {
      title,
      description,
      icon,
      difficulty,
      block,
      order: (maxOrder._max.order ?? -1) + 1,
      userId: session.user.id,
      colocId,
    },
  })

  return NextResponse.json(habit, { status: 201 })
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
  const { habitId } = await request.json()

  if (!habitId) {
    return NextResponse.json({ error: 'habitId requis' }, { status: 400 })
  }

  // Vérifier que l'habit appartient au user
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: session.user.id, colocId },
  })
  if (!habit) {
    return NextResponse.json({ error: 'Habitude introuvable' }, { status: 404 })
  }

  await prisma.habit.delete({ where: { id: habitId } })

  return NextResponse.json({ success: true })
}
