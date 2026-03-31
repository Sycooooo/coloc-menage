import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId } = await params

  // Vérifier que l'utilisateur est admin
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Seul l\'admin peut modifier les paramètres' }, { status: 403 })
  }

  const body = await request.json()

  const coloc = await prisma.colocation.update({
    where: { id: colocId },
    data: {
      maxQuestsPerDay: body.maxQuestsPerDay,
    },
    select: { maxQuestsPerDay: true },
  })

  return NextResponse.json(coloc)
}
