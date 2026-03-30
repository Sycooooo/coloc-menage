import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Créer une tâche
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { title, description, colocId, assignedToId, dueDate, recurrence } =
    await request.json()

  if (!title || !colocId) {
    return NextResponse.json({ error: 'Titre et coloc requis' }, { status: 400 })
  }

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
      colocId,
      assignedToId,
      dueDate: dueDate ? new Date(dueDate) : null,
      recurrence,
    },
    include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
  })

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
    include: { assignedTo: { select: { id: true, name: true, avatar: true } } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tasks)
}
