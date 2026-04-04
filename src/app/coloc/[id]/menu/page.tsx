import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Menu from '@/components/Menu'
import PageTransition from '@/components/PageTransition'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PixelIcon from '@/components/ui/PixelIcon'

export default async function MenuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const coloc = await prisma.colocation.findUnique({
    where: { id },
    select: { id: true, name: true },
  })
  if (!coloc) notFound()

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId: id } },
  })
  if (!membership) redirect('/')

  // Charger le menu le plus récent
  const latestMenu = await prisma.weeklyMenu.findFirst({
    where: { colocId: id },
    orderBy: { createdAt: 'desc' },
  })

  const initialMenu = latestMenu ? {
    id: latestMenu.id,
    meals: JSON.parse(latestMenu.meals),
    shoppingList: latestMenu.shoppingList ? JSON.parse(latestMenu.shoppingList) : null,
    nbPersons: latestMenu.nbPersons,
    restrictions: latestMenu.restrictions,
    budget: latestMenu.budget,
  } : null

  return (
    <div className="min-h-screen relative z-10" data-room="cuisine">
      <PageAmbiance theme="cuisine" />
      <header className="glass-header-lofi sticky top-0 z-40 px-6 py-4 flex items-center gap-3">
        <Link href={`/coloc/${id}`} className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <PixelIcon name="menu" size={24} className="text-amber-400" />
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">{coloc.name} — Menu & Courses</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <PageTransition>
          <Menu colocId={id} initialMenu={initialMenu} />
        </PageTransition>
      </main>
    </div>
  )
}
