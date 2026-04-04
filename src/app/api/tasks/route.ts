import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { notify } from '@/lib/notifications'
import { pusher } from '@/lib/pusher'

// Créer une tâche
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const result = createTaskSchema.safeParse(await request.json())
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }
  const { title, description, colocId, assignedToId, dueDate, recurrence, difficulty, room } = result.data

  // Vérifier que l'user est membre de la coloc
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      difficulty,
      room,
      colocId,
      assignedToId,
      dueDate: dueDate ? new Date(dueDate) : null,
      recurrence,
    },
    include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
  })

  await pusher.trigger(`coloc-${colocId}`, 'new-task', task)

  // Notifier la personne assignée (si différente du créateur)
  if (assignedToId && assignedToId !== session.user.id) {
    const creator = await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } })
    await notify(
      assignedToId,
      colocId,
      'task_assigned',
      `${creator?.username} t'a assigné "${title}"`,
      `/coloc/${colocId}/tasks`
    )
  }

  return NextResponse.json(task, { status: 201 })
}

// Lister les tâches d'une coloc
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const colocId = searchParams.get('colocId')

  if (!colocId) {
    return NextResponse.json({ error: 'colocId requis' }, { status: 400 })
  }

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const tasks = await prisma.task.findMany({
    where: { colocId },
    include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tasks)
}
