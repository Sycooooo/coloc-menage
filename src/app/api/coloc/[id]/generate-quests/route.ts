import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId } = await params

  // Vérifier que l'utilisateur est admin de la coloc
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (membership.role !== 'admin') {
    return NextResponse.json({ error: 'Seul l\'admin peut générer des quêtes' }, { status: 403 })
  }

  // Récupérer les membres de la coloc
  const members = await prisma.userColoc.findMany({
    where: { colocId },
    select: { userId: true },
  })
  if (members.length === 0) {
    return NextResponse.json({ error: 'Aucun membre dans la coloc' }, { status: 400 })
  }

  // Récupérer tous les templates
  const templates = await prisma.questTemplate.findMany()
  if (templates.length === 0) {
    return NextResponse.json({ error: 'Aucun template disponible' }, { status: 400 })
  }

  // Sélectionner des templates pour la semaine
  // On prend les quêtes hebdomadaires + quelques quotidiennes + les mensuelles si on est en début de mois
  const now = new Date()
  const isStartOfMonth = now.getDate() <= 7

  const selectedTemplates = templates.filter((t) => {
    if (t.recurrence === 'weekly') return true
    if (t.recurrence === 'daily') return true
    if (t.recurrence === 'monthly' && isStartOfMonth) return true
    return false
  })

  // Mélanger les templates aléatoirement
  const shuffled = selectedTemplates.sort(() => Math.random() - 0.5)

  // Limiter à un nombre raisonnable (3-5 quêtes par membre)
  const questsPerMember = 4
  const totalQuests = Math.min(shuffled.length, members.length * questsPerMember)
  const selected = shuffled.slice(0, totalQuests)

  // Distribuer équitablement entre les membres
  const memberIds = members.map((m) => m.userId)
  let created = 0

  // Calculer les dates de la semaine
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  for (let i = 0; i < selected.length; i++) {
    const template = selected[i]
    const assignedToId = memberIds[i % memberIds.length]

    // Calculer la dueDate selon la récurrence
    let dueDate: Date
    if (template.recurrence === 'daily') {
      // Due aujourd'hui
      dueDate = new Date(now)
      dueDate.setHours(23, 59, 0, 0)
    } else {
      // Due dimanche (fin de semaine)
      dueDate = sunday
    }

    await prisma.task.create({
      data: {
        title: template.title,
        description: template.description,
        difficulty: template.difficulty,
        category: template.category,
        room: template.room,
        recurrence: template.recurrence,
        dueDate,
        colocId,
        assignedToId,
      },
    })
    created++
  }

  return NextResponse.json({
    success: true,
    created,
    message: `${created} quêtes générées pour la semaine !`,
  })
}
