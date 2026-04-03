import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XP_REWARDS, COIN_REWARDS, getStreakMultiplier } from '@/lib/xp'
import { detectRankChange } from '@/lib/ranking'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; habitId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: colocId, habitId } = await params

  // Vérifier habit + membership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, colocId, userId: session.user.id },
  })
  if (!habit) {
    return NextResponse.json({ error: 'Habitude introuvable' }, { status: 404 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check si déjà complété aujourd'hui
  const existingLog = await prisma.habitLog.findUnique({
    where: { habitId_userId_date: { habitId, userId: session.user.id, date: today } },
  })

  // === DÉCOMPLETER ===
  if (existingLog?.completed) {
    await prisma.habitLog.update({
      where: { id: existingLog.id },
      data: { completed: false },
    })
    return NextResponse.json({ success: true, completed: false })
  }

  // === COMPLÉTER ===

  // Upsert le log
  await prisma.habitLog.upsert({
    where: { habitId_userId_date: { habitId, userId: session.user.id, date: today } },
    update: { completed: true },
    create: { habitId, userId: session.user.id, date: today, completed: true },
  })

  // Calculer le streak per-habit (jours consécutifs backward)
  const recentLogs = await prisma.habitLog.findMany({
    where: { habitId, userId: session.user.id, completed: true, date: { lte: today } },
    orderBy: { date: 'desc' },
    take: 60,
  })

  let habitStreak = 0
  const checkDate = new Date(today)
  for (const log of recentLogs) {
    const logDate = new Date(log.date)
    logDate.setHours(0, 0, 0, 0)
    if (logDate.getTime() === checkDate.getTime()) {
      habitStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Calculer les récompenses
  const streakMultiplier = getStreakMultiplier(habitStreak)
  const baseXp = XP_REWARDS[habit.difficulty] ?? 50
  const xpGained = Math.round(baseXp * streakMultiplier)
  const coinsGained = COIN_REWARDS[habit.difficulty] ?? 0

  // Mettre à jour le streak global de l'user
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  let newStreak = user.currentStreak
  if (user.lastActiveDate) {
    const lastActive = new Date(user.lastActiveDate)
    lastActive.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) newStreak = user.currentStreak + 1
    else if (diffDays > 1) newStreak = 1
  } else {
    newStreak = 1
  }

  const oldRankPoints = user.rankPoints

  // Mise à jour en base
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      xp: { increment: xpGained },
      rankPoints: { increment: xpGained },
      currency: { increment: coinsGained },
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastActiveDate: today,
    },
  })

  await prisma.score.upsert({
    where: { userId_colocId: { userId: session.user.id, colocId } },
    update: { points: { increment: xpGained } },
    create: { userId: session.user.id, colocId, points: xpGained },
  })

  // Détection rank-up
  const rankChange = detectRankChange(oldRankPoints, oldRankPoints + xpGained)
  const rankUp = rankChange.type !== 'none' ? {
    type: rankChange.type,
    newRank: {
      tier: rankChange.newRank.tier,
      name: rankChange.newRank.name,
      icon: rankChange.newRank.icon,
      color: rankChange.newRank.color,
      glow: rankChange.newRank.glow,
      division: rankChange.newRank.division,
      label: rankChange.newRank.label,
      points: rankChange.newRank.points,
    },
  } : null

  return NextResponse.json({
    success: true,
    completed: true,
    xpGained,
    coinsGained,
    habitStreak,
    streakMultiplier,
    rankUp,
  })
}
