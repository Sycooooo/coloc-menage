import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET : Récupérer la config avatar du user connecté
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const config = await prisma.avatarConfig.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(config)
}

// PUT : Créer ou mettre à jour la config avatar
export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { skinTone, body: bodySprite, hair, eyes, top, bottom, shoes, accessory } = body

  // Valider les valeurs de skin tone
  const validSkinTones = ['light', 'medium', 'tan', 'dark', 'deep']
  if (skinTone && !validSkinTones.includes(skinTone)) {
    return NextResponse.json({ error: 'Ton de peau invalide' }, { status: 400 })
  }

  // Vérifier que les items équipés sont soit gratuits soit possédés par le user
  const itemSlugs = [hair, top, bottom, shoes, accessory].filter(Boolean) as string[]

  if (itemSlugs.length > 0) {
    // Récupérer les items gratuits
    const freeItems = await prisma.shopItem.findMany({
      where: { isFree: true, spriteName: { in: itemSlugs } },
      select: { spriteName: true },
    })
    const freeSlugs = new Set(freeItems.map((i) => i.spriteName))

    // Récupérer les items possédés
    const ownedItems = await prisma.userItem.findMany({
      where: { userId: session.user.id },
      include: { item: { select: { spriteName: true } } },
    })
    const ownedSlugs = new Set(ownedItems.map((i) => i.item.spriteName))

    // Vérifier chaque slug
    for (const slug of itemSlugs) {
      if (!freeSlugs.has(slug) && !ownedSlugs.has(slug)) {
        return NextResponse.json(
          { error: `Item "${slug}" non possédé` },
          { status: 403 }
        )
      }
    }
  }

  // Upsert la config
  const config = await prisma.avatarConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      skinTone: skinTone || 'medium',
      body: bodySprite || 'default',
      hair: hair || null,
      eyes: eyes || 'default',
      top: top || null,
      bottom: bottom || null,
      shoes: shoes || null,
      accessory: accessory || null,
    },
    update: {
      skinTone: skinTone || 'medium',
      body: bodySprite || 'default',
      hair: hair || null,
      eyes: eyes || 'default',
      top: top || null,
      bottom: bottom || null,
      shoes: shoes || null,
      accessory: accessory || null,
    },
  })

  return NextResponse.json(config)
}
