import { prisma } from '@/lib/prisma'

// Envoie une notification à un utilisateur
export async function notify(userId: string, colocId: string, type: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, colocId, type, message, link },
  })
}

// Envoie une notification à tous les membres d'une coloc sauf l'auteur
export async function notifyColoc(colocId: string, excludeUserId: string, type: string, message: string, link?: string) {
  const members = await prisma.userColoc.findMany({
    where: { colocId },
    select: { userId: true },
  })

  for (const m of members) {
    if (m.userId !== excludeUserId) {
      await prisma.notification.create({
        data: { userId: m.userId, colocId, type, message, link },
      })
    }
  }
}
