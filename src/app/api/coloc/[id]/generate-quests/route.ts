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

  // Vérifier admin
  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Seul l\'admin peut générer des quêtes' }, { status: 403 })
  }

  // Récupérer la coloc et ses paramètres
  const coloc = await prisma.colocation.findUnique({
    where: { id: colocId },
    select: { maxQuestsPerDay: true },
  })
  if (!coloc) {
    return NextResponse.json({ error: 'Coloc introuvable' }, { status: 404 })
  }

  // Récupérer les membres
  const members = await prisma.userColoc.findMany({
    where: { colocId },
    select: { userId: true },
  })
  if (members.length === 0) {
    return NextResponse.json({ error: 'Aucun membre' }, { status: 400 })
  }
  const memberIds = members.map((m) => m.userId)

  // Récupérer les templates actifs pour cette coloc
  const colocTemplates = await prisma.colocTemplate.findMany({
    where: { colocId, isActive: true },
    include: { template: true },
  })

  if (colocTemplates.length === 0) {
    return NextResponse.json(
      { error: 'Aucune quête configurée. Va dans Admin pour activer des quêtes.' },
      { status: 400 }
    )
  }

  // Construire la liste des quêtes à distribuer
  const quests = colocTemplates.map((ct) => {
    if (ct.isCustom) {
      return {
        title: ct.title!,
        description: ct.description,
        category: ct.category ?? 'cleaning',
        room: ct.room,
        difficulty: ct.difficulty ?? 'medium',
        recurrence: ct.recurrence ?? 'weekly',
      }
    }
    return {
      title: ct.template!.title,
      description: ct.template!.description,
      category: ct.template!.category,
      room: ct.template!.room,
      difficulty: ct.template!.difficulty,
      recurrence: ct.template!.recurrence,
    }
  })

  // Filtrer par récurrence
  const now = new Date()
  const isStartOfMonth = now.getDate() <= 7
  const filtered = quests.filter((q) => {
    if (q.recurrence === 'weekly') return true
    if (q.recurrence === 'daily') return true
    if (q.recurrence === 'monthly' && isStartOfMonth) return true
    return false
  })

  // Récupérer les affinités
  const affinities = await prisma.memberAffinity.findMany({
    where: { colocId },
  })

  // Compter les tâches déjà assignées cette semaine pour la rotation
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const tasksThisWeek = await prisma.task.findMany({
    where: {
      colocId,
      createdAt: { gte: monday },
    },
    select: { assignedToId: true, difficulty: true },
  })

  // Compter combien de tâches chaque membre a déjà cette semaine
  const weeklyCount: Record<string, number> = {}
  for (const id of memberIds) {
    weeklyCount[id] = tasksThisWeek.filter((t) => t.assignedToId === id).length
  }

  // Limite max par semaine = maxQuestsPerDay * 7
  const maxPerWeek = coloc.maxQuestsPerDay * 7

  // Mélanger les quêtes
  const shuffled = filtered.sort(() => Math.random() - 0.5)

  // Fonction pour choisir le meilleur membre pour une quête
  function pickMember(category: string): string | null {
    // Calculer un score pour chaque membre
    const scores: { userId: string; score: number }[] = []

    for (const id of memberIds) {
      // Si le membre a atteint sa limite, skip
      if (weeklyCount[id] >= maxPerWeek) continue

      let score = 0

      // Moins de tâches cette semaine = priorité (rotation)
      score += (maxPerWeek - weeklyCount[id]) * 10

      // Affinité pour cette catégorie = bonus
      const aff = affinities.find((a) => a.userId === id && a.category === category)
      if (aff) score += aff.weight * 20

      scores.push({ userId: id, score })
    }

    if (scores.length === 0) return null

    // Trier par score décroissant, prendre le meilleur
    scores.sort((a, b) => b.score - a.score)
    return scores[0].userId
  }

  let created = 0

  for (const quest of shuffled) {
    const assignedToId = pickMember(quest.category)
    if (!assignedToId) continue // Tout le monde est au max

    const difficulty = quest.difficulty

    let dueDate: Date
    if (quest.recurrence === 'daily') {
      dueDate = new Date(now)
      dueDate.setHours(23, 59, 0, 0)
    } else {
      dueDate = sunday
    }

    await prisma.task.create({
      data: {
        title: quest.title,
        description: quest.description,
        difficulty,
        category: quest.category,
        room: quest.room,
        recurrence: quest.recurrence,
        dueDate,
        colocId,
        assignedToId,
      },
    })

    weeklyCount[assignedToId]++
    created++
  }

  // Marquer le setup comme fait
  if (!coloc) {
    return NextResponse.json({ error: 'Coloc introuvable' }, { status: 404 })
  }
  await prisma.colocation.update({
    where: { id: colocId },
    data: { questsSetupDone: true },
  })

  return NextResponse.json({
    success: true,
    created,
    message: `${created} quêtes générées pour la semaine !`,
  })
}
