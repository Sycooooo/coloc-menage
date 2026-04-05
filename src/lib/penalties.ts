import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notifications'

export type PenaltyResult = {
  userId: string
  type: string
  amount: number
  message: string
}

/**
 * Vérifie et applique toutes les pénalités pour une colocation.
 * Appelé par le cron daily et au chargement du dashboard.
 */
export async function checkPenalties(colocId: string): Promise<PenaltyResult[]> {
  const activeMembers = await prisma.userColoc.findMany({
    where: { colocId, isAway: false },
    include: { user: true },
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monday = getMonday(now)
  const penalties: PenaltyResult[] = []

  for (const member of activeMembers) {
    const user = member.user

    // Période de grâce : pas de pénalités pendant 7 jours après avoir rejoint la coloc
    const daysSinceJoined = Math.floor((today.getTime() - new Date(member.joinedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceJoined < 7) continue

    // === 3a. Tâches expirées → -70 XP chacune (pas les daily, elles sont juste supprimées) ===
    const expiredTasks = await prisma.task.findMany({
      where: {
        colocId,
        assignedToId: user.id,
        status: 'pending',
        dueDate: { lt: today },
        recurrence: { not: 'daily' },
      },
    })

    for (const task of expiredTasks) {
      const loss = Math.min(70, user.xp)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: { decrement: loss },
          rankPoints: { decrement: Math.min(70, user.rankPoints) },
        },
      })
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'expired' },
      })
      penalties.push({
        userId: user.id,
        type: 'expired_task',
        amount: 70,
        message: `Tâche expirée : "${task.title}" — -70 XP`,
      })
    }

    // === 3c. Semaine sans tâche → 0.5x multiplicateur ===
    const completedThisWeek = await prisma.taskHistory.count({
      where: {
        completedById: user.id,
        completedAt: { gte: monday },
        task: { colocId },
      },
    })

    if (completedThisWeek === 0) {
      if (!member.penaltyUntil || member.penaltyUntil < now) {
        const nextSunday = new Date(monday)
        nextSunday.setDate(monday.getDate() + 13)
        nextSunday.setHours(23, 59, 59, 999)

        await prisma.userColoc.update({
          where: { id: member.id },
          data: { penaltyXpMult: 0.5, penaltyUntil: nextSunday },
        })
        penalties.push({
          userId: user.id,
          type: 'week_inactive',
          amount: 0,
          message: 'Aucune tâche complétée cette semaine — XP réduit de 50% !',
        })
      }
    }

    // === 3d. 3 jours inactifs → -200 coins ===
    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate)
      lastActive.setHours(0, 0, 0, 0)
      const inactiveDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      if (inactiveDays >= 3) {
        const alreadyTaxed = await prisma.penaltyLog.findFirst({
          where: {
            userId: user.id,
            colocId,
            type: 'inactivity_tax',
            createdAt: { gte: today },
          },
        })
        if (!alreadyTaxed && user.currency > 0) {
          const loss = Math.min(200, user.currency)
          await prisma.user.update({
            where: { id: user.id },
            data: { currency: { decrement: loss } },
          })
          penalties.push({
            userId: user.id,
            type: 'inactivity_tax',
            amount: loss,
            message: `${inactiveDays} jours d'inactivité — -${loss} coins !`,
          })
        }
      }
    }

    // === 3e. Streak = 0 → personnage nu ===
    if (user.currentStreak === 0 && user.lastActiveDate) {
      const avatarConfig = await prisma.avatarConfig.findUnique({
        where: { userId: user.id },
      })
      if (avatarConfig && !avatarConfig.savedOutfit && (avatarConfig.hair || avatarConfig.top || avatarConfig.bottom || avatarConfig.shoes || avatarConfig.accessory)) {
        const outfit = {
          hair: avatarConfig.hair,
          top: avatarConfig.top,
          bottom: avatarConfig.bottom,
          shoes: avatarConfig.shoes,
          accessory: avatarConfig.accessory,
        }
        await prisma.avatarConfig.update({
          where: { userId: user.id },
          data: {
            savedOutfit: outfit,
            hair: null,
            top: null,
            bottom: null,
            shoes: null,
            accessory: null,
          },
        })
        await prisma.userColoc.update({
          where: { id: member.id },
          data: { lazyTasksDone: 0 },
        })
        penalties.push({
          userId: user.id,
          type: 'items_stripped',
          amount: 0,
          message: 'Streak à 0 — ton personnage a été déshabillé !',
        })
        await notify(user.id, colocId, 'penalty', 'Ton streak est tombé à 0, ton personnage a été déshabillé ! Complète 3 tâches pour récupérer tes vêtements.')
      }
    }

    // === 3f. Badge "fainéant" — 5 jours sans tâche ===
    if (user.lastActiveDate && !member.lazyBadge) {
      const lastActive = new Date(user.lastActiveDate)
      lastActive.setHours(0, 0, 0, 0)
      const inactiveDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

      if (inactiveDays >= 5) {
        await prisma.userColoc.update({
          where: { id: member.id },
          data: { lazyBadge: true, lazyTasksDone: 0 },
        })
        penalties.push({
          userId: user.id,
          type: 'lazy_badge',
          amount: 0,
          message: '5 jours sans activité — badge Fainéant activé !',
        })
        await notify(user.id, colocId, 'penalty', 'Tu as reçu le badge Fainéant ! Complète 3 tâches pour le retirer.')
      }
    }

    // === 3h. Rétrogradation de rang — 3+ tâches expirées cette semaine ===
    const totalExpiredThisWeek = await prisma.task.count({
      where: {
        colocId,
        assignedToId: user.id,
        status: 'expired',
        dueDate: { gte: monday },
      },
    })

    if (totalExpiredThisWeek >= 3) {
      const alreadyDemoted = await prisma.penaltyLog.findFirst({
        where: {
          userId: user.id,
          colocId,
          type: 'rank_demotion',
          createdAt: { gte: monday },
        },
      })
      if (!alreadyDemoted) {
        const loss = Math.floor(user.rankPoints * 0.10)
        if (loss > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { rankPoints: { decrement: loss } },
          })
          penalties.push({
            userId: user.id,
            type: 'rank_demotion',
            amount: loss,
            message: `${totalExpiredThisWeek} tâches expirées cette semaine — rétrogradation ! -${loss} rank points`,
          })
          await notify(user.id, colocId, 'penalty', 'Tu as été rétrogradé ! Trop de tâches expirées cette semaine.')
        }
      }
    }

    // === 3i. 3 habits ratés d'affilée → -25% XP 24h ===
    const userHabits = await prisma.habit.findMany({
      where: { userId: user.id, colocId, isActive: true },
    })

    if (userHabits.length > 0) {
      let missedDays = 0
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - 1)

      for (let i = 0; i < 10; i++) {
        const dayCompleted = await prisma.habitLog.count({
          where: {
            userId: user.id,
            date: checkDate,
            completed: true,
            habit: { colocId },
          },
        })
        if (dayCompleted === 0) {
          missedDays++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      if (missedDays >= 3) {
        const alreadyPenalized = await prisma.penaltyLog.findFirst({
          where: {
            userId: user.id,
            colocId,
            type: 'habit_miss',
            createdAt: { gte: today },
          },
        })
        if (!alreadyPenalized) {
          const penaltyUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          await prisma.userColoc.update({
            where: { id: member.id },
            data: { penaltyXpMult: 0.75, penaltyUntil },
          })
          penalties.push({
            userId: user.id,
            type: 'habit_miss',
            amount: 0,
            message: `${missedDays} jours sans habit — XP réduit de 25% pendant 24h !`,
          })
          await notify(user.id, colocId, 'penalty', `${missedDays} jours sans compléter d'habitude ! -25% XP pendant 24h.`)
        }
      }
    }
  }

  // Créer les PenaltyLogs
  if (penalties.length > 0) {
    await prisma.penaltyLog.createMany({
      data: penalties.map((p) => ({
        userId: p.userId,
        colocId,
        type: p.type,
        amount: p.amount,
        message: p.message,
      })),
    })
  }

  return penalties
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}
