import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Récupérer les notifications de l'utilisateur
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })

  return NextResponse.json({ notifications, unreadCount })
}

// POST — Marquer les notifications comme lues
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
