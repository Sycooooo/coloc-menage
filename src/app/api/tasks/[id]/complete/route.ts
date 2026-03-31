import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XP_REWARDS, COIN_REWARDS, getStreakMultiplier, getLevel } from '@/lib/xp'
import { notifyColoc } from '@/lib/notifications'

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

  // Récupérer l'utilisateur pour le streak
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  // === Calcul du streak ===
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let newStreak = user.currentStreak
  if (user.lastActiveDate) {
    const lastActive = new Date(user.lastActiveDate)
    lastActive.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Jour consécutif -> streak +1
      newStreak = user.currentStreak + 1
    } else if (diffDays === 0) {
      // Même jour -> streak inchangé
      newStreak = user.currentStreak
    } else {
      // Plus d'un jour sans activité -> streak reset à 1
      newStreak = 1
    }
  } else {
    // Première activité
    newStreak = 1
  }

  const newLongestStreak = Math.max(newStreak, user.longestStreak)

  // === Calcul des récompenses ===
  const streakMultiplier = getStreakMultiplier(newStreak)
  const baseXp = XP_REWARDS[task.difficulty] ?? 50
  const xpGained = Math.round(baseXp * streakMultiplier)
  const coinsGained = COIN_REWARDS[task.difficulty] ?? 0

  // === Mise à jour en base ===
  try {
    await prisma.task.update({ where: { id }, data: { status: 'done' } })
    await prisma.taskHistory.create({
      data: { taskId: id, completedById: session.user.id },
    })
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        xp: { increment: xpGained },
        currency: { increment: coinsGained },
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
      },
    })
    await prisma.score.upsert({
      where: { userId_colocId: { userId: session.user.id, colocId: task.colocId } },
      update: { points: { increment: xpGained } },
      create: { userId: session.user.id, colocId: task.colocId, points: xpGained },
    })
  } catch (err) {
    console.error('Erreur mise à jour:', err)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  // === Notification aux colocataires ===
  await notifyColoc(
    task.colocId,
    session.user.id,
    'task_completed',
    `${user.username} a terminé "${task.title}" !`,
    `/coloc/${task.colocId}`
  )

  // === Vérification des achievements ===
  let newAchievements: { name: string; icon: string; reward: number }[] = []
  try {
    newAchievements = await checkAchievements(session.user.id)
  } catch (err) {
    console.error('Erreur achievements:', err)
  }

  return NextResponse.json({
    success: true,
    xpGained,
    coinsGained,
    streak: newStreak,
    streakMultiplier,
    newAchievements,
  })
}

// Vérifie et débloque les achievements que l'utilisateur a atteints
async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      completedTasks: { include: { task: true } },
      achievements: true,
    },
  })
  if (!user) return []

  // Récupérer tous les achievements pas encore débloqués
  const allAchievements = await prisma.achievement.findMany()
  const unlockedIds = new Set(user.achievements.map((a) => a.achievementId))
  const newlyUnlocked: { name: string; icon: string; reward: number }[] = []

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue

    const [type, valueStr] = achievement.condition.split(':')
    const target = parseInt(valueStr)

    let earned = false

    switch (type) {
      case 'tasks_completed':
        earned = user.completedTasks.length >= target
        break
      case 'hard_tasks':
        earned = user.completedTasks.filter((t) => t.task.difficulty === 'hard').length >= target
        break
      case 'streak':
        earned = user.currentStreak >= target
        break
      case 'level':
        earned = getLevel(user.xp) >= target
        break
      case 'coins':
        earned = user.currency >= target
        break
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      })
      // Donner la récompense en coins
      if (achievement.reward > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { currency: { increment: achievement.reward } },
        })
      }
      newlyUnlocked.push({
        name: achievement.name,
        icon: achievement.icon,
        reward: achievement.reward,
      })
    }
  }

  return newlyUnlocked
}
