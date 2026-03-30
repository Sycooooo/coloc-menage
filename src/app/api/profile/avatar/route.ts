import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar') as File

  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Fichier doit être une image' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop grande (max 2Mo)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filename = `${session.user.id}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await writeFile(
    path.join(process.cwd(), 'public', 'avatars', filename),
    buffer
  )

  const avatarUrl = `/avatars/${filename}`

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
