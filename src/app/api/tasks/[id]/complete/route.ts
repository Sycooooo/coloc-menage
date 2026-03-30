import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XP_REWARDS } from '@/lib/xp'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  // Vérifier appartenance à la coloc
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId: task.colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const xpGained = XP_REWARDS[task.difficulty] ?? 50

  await prisma.$transaction([
    prisma.task.update({ where: { id }, data: { status: 'done' } }),
    prisma.taskHistory.create({
      data: { taskId: id, completedById: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: xpGained } },
    }),
    prisma.score.upsert({
      where: { userId_colocId: { userId: session.user.id, colocId: task.colocId } },
      update: { points: { increment: xpGained } },
      create: { userId: session.user.id, colocId: task.colocId, points: xpGained },
    }),
  ])

  return NextResponse.json({ success: true, xpGained })
}
