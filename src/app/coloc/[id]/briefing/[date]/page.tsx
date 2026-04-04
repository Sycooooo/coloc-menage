import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import BriefingView from '@/components/BriefingView'

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function formatDate(date: Date) {
  const d = new Date(date)
  return `${DAYS_FR[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatDateSlug(date: Date) {
  return new Date(date).toISOString().split('T')[0]
}

export default async function BriefingDetailPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id, date } = await params

  const coloc = await prisma.colocation.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!coloc) notFound()

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId: id } },
  })
  if (!membership) redirect('/')

  const parsedDate = new Date(date + 'T00:00:00.000Z')
  if (isNaN(parsedDate.getTime())) notFound()

  const briefing = await prisma.briefing.findUnique({
    where: { date: parsedDate },
  })
  if (!briefing) notFound()

  // Navigation: prev/next
  const [prev, next] = await Promise.all([
    prisma.briefing.findFirst({
      where: { date: { lt: parsedDate } },
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
    prisma.briefing.findFirst({
      where: { date: { gt: parsedDate } },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
  ])

  const sections = briefing.sections as unknown as Parameters<typeof BriefingView>[0]['sections']
  const sources = (briefing.sources || []) as unknown as Parameters<typeof BriefingView>[0]['sources']

  return (
    <div className="min-h-screen relative z-10 bg-[#0a0a14]">
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center gap-3 bg-[#0a0a14] border-b border-[#252a38]">
        <Link href={`/coloc/${id}/briefing`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <span className="text-xl">📡</span>
        <h1 className="font-display text-lg tracking-wide text-t-primary uppercase neon-title flex-1">
          {formatDate(briefing.date)}
        </h1>
      </header>

      {/* Navigation prev/next */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#252a38] bg-[#0a0a14]">
        {prev ? (
          <Link href={`/coloc/${id}/briefing/${formatDateSlug(prev.date)}`} className="text-xs text-accent hover:underline">
            ← Jour précédent
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/coloc/${id}/briefing/${formatDateSlug(next.date)}`} className="text-xs text-accent hover:underline">
            Jour suivant →
          </Link>
        ) : (
          <span />
        )}
      </div>

      <main className="max-w-2xl mx-auto p-6">
        <PageTransition>
          <BriefingView
            sections={sections}
            sources={sources}
            evalText={briefing.evalText}
            score={briefing.score}
          />
        </PageTransition>
      </main>
    </div>
  )
}
