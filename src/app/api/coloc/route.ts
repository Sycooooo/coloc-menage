import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Créer une colocation
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }

  const coloc = await prisma.colocation.create({
    data: {
      name,
      members: {
        create: {
          userId: session.user.id,
          role: 'admin',
        },
      },
    },
    include: { members: { include: { user: true } } },
  })

  return NextResponse.json(coloc, { status: 201 })
}

// Lister les colocations de l'utilisateur
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const colocs = await prisma.colocation.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  })

  return NextResponse.json(colocs)
}
