import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CharacterCreator from '@/components/CharacterCreator'

export default async function CharacterPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Config actuelle du user (ou null)
  const avatarConfig = await prisma.avatarConfig.findUnique({
    where: { userId: session.user.id },
  })

  // Items gratuits (disponibles pour tous)
  const freeItems = await prisma.shopItem.findMany({
    where: { isFree: true, type: 'avatar_part' },
    orderBy: { layer: 'asc' },
  })

  // Items possédés par le user (achetés en boutique)
  const ownedUserItems = await prisma.userItem.findMany({
    where: { userId: session.user.id },
    include: {
      item: true,
    },
  })
  const ownedItems = ownedUserItems
    .map((ui) => ui.item)
    .filter((item) => item.type === 'avatar_part')

  // Combiner gratuits + possédés (sans doublons)
  const ownedIds = new Set(ownedItems.map((i) => i.id))
  const allAvailableItems = [
    ...freeItems,
    ...ownedItems.filter((i) => !freeItems.some((f) => f.id === i.id)),
  ]

  // Items payants non possédés (pour montrer les cadenas)
  const lockedItems = await prisma.shopItem.findMany({
    where: {
      type: 'avatar_part',
      isFree: false,
      id: { notIn: [...ownedIds] },
    },
    orderBy: { price: 'asc' },
  })

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-b px-6 py-4 flex items-center gap-3">
        <Link href="/profile" className="text-t-muted hover:text-t-primary transition">
          ←
        </Link>
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase">
          Mon personnage
        </h1>
      </header>

      <CharacterCreator
        initialConfig={avatarConfig ? {
          skinTone: avatarConfig.skinTone,
          body: avatarConfig.body,
          hair: avatarConfig.hair,
          eyes: avatarConfig.eyes,
          top: avatarConfig.top,
          bottom: avatarConfig.bottom,
          shoes: avatarConfig.shoes,
          accessory: avatarConfig.accessory,
        } : null}
        availableItems={allAvailableItems.map((i) => ({
          id: i.id,
          name: i.name,
          layer: i.layer!,
          spriteName: i.spriteName!,
          rarity: i.rarity,
          isFree: i.isFree,
        }))}
        lockedItems={lockedItems.map((i) => ({
          id: i.id,
          name: i.name,
          layer: i.layer!,
          spriteName: i.spriteName!,
          rarity: i.rarity,
          price: i.price,
        }))}
      />
    </div>
  )
}
