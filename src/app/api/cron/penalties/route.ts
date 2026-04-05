import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPenalties } from '@/lib/penalties'

// POST /api/cron/penalties
// Appelé quotidiennement par un cron job.
// Protégé par un secret dans le header Authorization.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || 'cron-penalties-secret'

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Supprimer les quêtes quotidiennes périmées (après 4h du matin)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const cutoff = new Date(today)
  cutoff.setHours(4, 0, 0, 0)
  if (now >= cutoff) {
    await prisma.task.deleteMany({
      where: {
        recurrence: 'daily',
        status: 'pending',
        dueDate: { lt: cutoff },
      },
    })
  }

  // Récupérer toutes les colocs actives
  const colocs = await prisma.colocation.findMany({
    select: { id: true, name: true },
  })

  const results: { colocId: string; colocName: string; penaltiesCount: number }[] = []

  for (const coloc of colocs) {
    const penalties = await checkPenalties(coloc.id)
    results.push({
      colocId: coloc.id,
      colocName: coloc.name,
      penaltiesCount: penalties.length,
    })
  }

  const totalPenalties = results.reduce((sum, r) => sum + r.penaltiesCount, 0)

  return NextResponse.json({
    success: true,
    colocsProcessed: colocs.length,
    totalPenalties,
    results,
  })
}
