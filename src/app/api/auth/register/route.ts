import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  if (username.length < 3) {
    return NextResponse.json({ error: 'Identifiant trop court (3 caractères min)' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { username, password: hashed },
    select: { id: true, username: true },
  })

  return NextResponse.json(user, { status: 201 })
}
