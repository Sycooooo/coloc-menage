import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseBriefingHtml } from '@/lib/parse-briefing'

// GET — Liste tous les briefings (date, score, résumé)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const briefings = await prisma.briefing.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      score: true,
      sections: true,
    },
  })

  return NextResponse.json(briefings)
}

// POST — Créer un briefing à partir de HTML brut
// Auth: soit session NextAuth, soit header X-API-Key
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const validApiKey = process.env.BRIEFING_API_KEY

  if (apiKey && validApiKey && apiKey === validApiKey) {
    // OK — authentifié par clé API
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
  }

  const { html } = await req.json()
  if (!html || typeof html !== 'string') {
    return NextResponse.json({ error: 'HTML requis' }, { status: 400 })
  }

  const parsed = parseBriefingHtml(html)

  // Normaliser la date (minuit UTC)
  const dateOnly = new Date(parsed.date)
  dateOnly.setUTCHours(0, 0, 0, 0)

  const briefing = await prisma.briefing.upsert({
    where: { date: dateOnly },
    update: {
      score: parsed.score,
      rawHtml: html,
      sections: JSON.parse(JSON.stringify(parsed.sections)),
      sources: JSON.parse(JSON.stringify(parsed.sources)),
      evalText: parsed.evalText,
    },
    create: {
      date: dateOnly,
      score: parsed.score,
      rawHtml: html,
      sections: JSON.parse(JSON.stringify(parsed.sections)),
      sources: JSON.parse(JSON.stringify(parsed.sources)),
      evalText: parsed.evalText,
    },
  })

  return NextResponse.json({ id: briefing.id, date: briefing.date, score: briefing.score })
}
