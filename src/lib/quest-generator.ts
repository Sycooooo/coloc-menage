import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notifications'

// Vérifie si on doit générer des quêtes et les génère si nécessaire
export async function autoGenerateQuests(colocId: string) {
  const coloc = await prisma.colocation.findUnique({
    where: { id: colocId },
    select: { maxQuestsPerDay: true, lastQuestGen: true },
  })
  if (!coloc) return { generated: false, reason: 'not_found' }

  // Vérifier qu'il y a des templates actifs (= admin a configuré les quêtes)
  const activeCount = await prisma.colocTemplate.count({
    where: { colocId, isActive: true },
  })
  if (activeCount === 0) return { generated: false, reason: 'no_templates' }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Supprimer les quêtes quotidiennes non faites (périmées après 4h du matin)
  const cutoff = new Date(today)
  cutoff.setHours(4, 0, 0, 0)
  if (now >= cutoff) {
    await prisma.task.deleteMany({
      where: {
        colocId,
        recurrence: 'daily',
        status: 'pending',
        dueDate: { lt: cutoff },
      },
    })
  }

  // Déterminer ce qu'il faut générer
  const lastGen = coloc.lastQuestGen
  const lastGenDate = lastGen ? new Date(lastGen.getFullYear(), lastGen.getMonth(), lastGen.getDate()) : null

  const needsDaily = !lastGenDate || lastGenDate < today
  const needsWeekly = needsWeeklyGen(lastGenDate, today)
  const needsMonthly = needsMonthlyGen(lastGenDate, today)

  if (!needsDaily && !needsWeekly && !needsMonthly) {
    return { generated: false, reason: 'already_done' }
  }

  // Récupérer les membres actifs (pas away)
  const members = await prisma.userColoc.findMany({
    where: { colocId, isAway: false },
    select: { userId: true },
  })
  if (members.length === 0) return { generated: false, reason: 'no_members' }
  const memberIds = members.map((m) => m.userId)

  // Récupérer les templates actifs
  const colocTemplates = await prisma.colocTemplate.findMany({
    where: { colocId, isActive: true },
    include: { template: true },
  })
  if (colocTemplates.length === 0) return { generated: false, reason: 'no_templates' }

  // Construire la liste des quêtes
  const allQuests = colocTemplates.map((ct) => {
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

  // Filtrer selon ce qu'on doit générer
  const quests = allQuests.filter((q) => {
    if (q.recurrence === 'daily' && needsDaily) return true
    if (q.recurrence === 'weekly' && needsWeekly) return true
    if (q.recurrence === 'monthly' && needsMonthly) return true
    return false
  })

  if (quests.length === 0) return { generated: false, reason: 'no_matching_quests' }

  // Récupérer les affinités
  const affinities = await prisma.memberAffinity.findMany({
    where: { colocId },
  })

  // Compter les tâches de la semaine pour la rotation
  const monday = getMonday(now)
  const tasksThisWeek = await prisma.task.findMany({
    where: { colocId, createdAt: { gte: monday } },
    select: { assignedToId: true },
  })

  const weeklyCount: Record<string, number> = {}
  for (const id of memberIds) {
    weeklyCount[id] = tasksThisWeek.filter((t) => t.assignedToId === id).length
  }

  const maxPerWeek = coloc.maxQuestsPerDay * 7

  // Dates limites
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  // Mélanger et distribuer
  const shuffled = quests.sort(() => Math.random() - 0.5)

  let created = 0
  for (const quest of shuffled) {
    const assignedToId = pickMember(memberIds, weeklyCount, maxPerWeek, affinities, quest.category)
    if (!assignedToId) continue

    let dueDate: Date
    if (quest.recurrence === 'daily') {
      dueDate = new Date(now)
      dueDate.setHours(23, 59, 0, 0)
    } else if (quest.recurrence === 'monthly') {
      dueDate = endOfMonth
    } else {
      dueDate = sunday
    }

    await prisma.task.create({
      data: {
        title: quest.title,
        description: quest.description,
        difficulty: quest.difficulty,
        category: quest.category,
        room: quest.room,
        recurrence: quest.recurrence,
        dueDate,
        colocId,
        assignedToId,
      },
    })

    await notify(
      assignedToId,
      colocId,
      'quest_generated',
      `Nouvelle quête : "${quest.title}"`,
      `/coloc/${colocId}`
    )

    weeklyCount[assignedToId]++
    created++
  }

  // Mettre à jour la date de dernière génération
  await prisma.colocation.update({
    where: { id: colocId },
    data: { lastQuestGen: now },
  })

  return { generated: true, created }
}

// --- Helpers ---

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function needsWeeklyGen(lastGen: Date | null, today: Date): boolean {
  if (!lastGen) return true
  const lastMonday = getMonday(lastGen)
  const thisMonday = getMonday(today)
  return lastMonday < thisMonday
}

function needsMonthlyGen(lastGen: Date | null, today: Date): boolean {
  if (!lastGen) return true
  return lastGen.getMonth() !== today.getMonth() || lastGen.getFullYear() !== today.getFullYear()
}

function pickMember(
  memberIds: string[],
  weeklyCount: Record<string, number>,
  maxPerWeek: number,
  affinities: { userId: string; category: string; weight: number }[],
  category: string
): string | null {
  const scores: { userId: string; score: number }[] = []

  for (const id of memberIds) {
    if (weeklyCount[id] >= maxPerWeek) continue

    let score = 0
    score += (maxPerWeek - weeklyCount[id]) * 10

    const aff = affinities.find((a) => a.userId === id && a.category === category)
    if (aff) score += aff.weight * 20

    scores.push({ userId: id, score })
  }

  if (scores.length === 0) return null
  scores.sort((a, b) => b.score - a.score)
  return scores[0].userId
}
