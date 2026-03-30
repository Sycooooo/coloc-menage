import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { inviteCode } = await request.json()
  if (!inviteCode) {
    return NextResponse.json({ error: 'Code requis' }, { status: 400 })
  }

  const coloc = await prisma.colocation.findUnique({ where: { inviteCode } })
  if (!coloc) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
  }

  const existing = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId: coloc.id } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Déjà membre' }, { status: 400 })
  }

  await prisma.userColoc.create({
    data: { userId: session.user.id, colocId: coloc.id },
  })

  return NextResponse.json(coloc)
}
