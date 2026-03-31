import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Récupérer tous les templates globaux + état d'activation pour cette coloc
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

  // Templates globaux
  const globalTemplates = await prisma.questTemplate.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })

  // Templates activés pour cette coloc
  const colocTemplates = await prisma.colocTemplate.findMany({
    where: { colocId },
  })

  // Construire la réponse : chaque template avec son état activé/désactivé
  const templates = globalTemplates.map((t) => {
    const ct = colocTemplates.find((c) => c.templateId === t.id)
    return {
      ...t,
      isActive: ct?.isActive ?? false,
      colocTemplateId: ct?.id ?? null,
    }
  })

  // Ajouter les quêtes custom (sans templateId)
  const customTemplates = colocTemplates
    .filter((c) => c.isCustom)
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      room: c.room,
      difficulty: c.difficulty,
      recurrence: c.recurrence,
      isActive: c.isActive,
      isCustom: true,
      colocTemplateId: c.id,
    }))

  return NextResponse.json({ templates, customTemplates })
}

// POST — Activer/désactiver un template OU créer une quête custom
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
    return NextResponse.json({ error: 'Seul l\'admin peut configurer les quêtes' }, { status: 403 })
  }

  const body = await request.json()

  // Cas 1 : Toggle un template global
  if (body.templateId) {
    const existing = await prisma.colocTemplate.findUnique({
      where: { templateId_colocId: { templateId: body.templateId, colocId } },
    })

    if (existing) {
      const updated = await prisma.colocTemplate.update({
        where: { id: existing.id },
        data: { isActive: !existing.isActive },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.colocTemplate.create({
      data: {
        templateId: body.templateId,
        colocId,
        isActive: true,
      },
    })
    return NextResponse.json(created, { status: 201 })
  }

  // Cas 2 : Créer une quête custom
  if (body.title) {
    const custom = await prisma.colocTemplate.create({
      data: {
        isCustom: true,
        title: body.title,
        description: body.description || null,
        category: body.category || 'cleaning',
        room: body.room || null,
        difficulty: body.difficulty || 'medium',
        recurrence: body.recurrence || 'weekly',
        colocId,
      },
    })
    return NextResponse.json(custom, { status: 201 })
  }

  return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
}

// DELETE — Supprimer une quête custom
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
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { colocTemplateId } = await request.json()

  await prisma.colocTemplate.delete({
    where: { id: colocTemplateId, colocId, isCustom: true },
  })

  return NextResponse.json({ success: true })
}
