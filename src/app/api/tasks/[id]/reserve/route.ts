import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyColoc } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  // Récupérer la tâche
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  // Vérifier que l'user est membre de la coloc
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId, colocId: task.colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Si la tâche est déjà terminée, on ne peut pas la réserver
  if (task.status === 'done') {
    return NextResponse.json({ error: 'Tâche déjà terminée' }, { status: 400 })
  }

  // Toggle : si l'user a déjà réservé → libérer, sinon → réserver
  if (task.assignedToId === userId) {
    // Libérer la tâche
    const updated = await prisma.task.update({
      where: { id },
      data: { assignedToId: null },
      include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
    })
    return NextResponse.json({ ...updated, action: 'released' })
  }

  // Si déjà réservée par quelqu'un d'autre
  if (task.assignedToId) {
    return NextResponse.json({ error: 'Tâche déjà réservée par un autre colocataire' }, { status: 409 })
  }

  // Réserver la tâche
  const updated = await prisma.task.update({
    where: { id },
    data: { assignedToId: userId },
    include: { assignedTo: { select: { id: true, username: true, avatar: true } } },
  })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
  await notifyColoc(
    task.colocId,
    userId,
    'task_assigned',
    `${user?.username} a réservé "${task.title}"`,
    `/coloc/${task.colocId}`
  )

  return NextResponse.json({ ...updated, action: 'reserved' })
}
