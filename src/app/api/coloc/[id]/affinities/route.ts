import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Récupérer les affinités de tous les membres
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

  const affinities = await prisma.memberAffinity.findMany({
    where: { colocId },
  })

  return NextResponse.json(affinities)
}

// POST — Définir une affinité (upsert)
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
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Seul l\'admin peut gérer les affinités' }, { status: 403 })
  }

  const { userId, category, weight } = await request.json()

  if (!userId || !category || weight === undefined) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // weight 0 = supprimer l'affinité
  if (weight === 0) {
    await prisma.memberAffinity.deleteMany({
      where: { userId, colocId, category },
    })
    return NextResponse.json({ success: true })
  }

  const affinity = await prisma.memberAffinity.upsert({
    where: { userId_colocId_category: { userId, colocId, category } },
    update: { weight },
    create: { userId, colocId, category, weight },
  })

  return NextResponse.json(affinity)
}
