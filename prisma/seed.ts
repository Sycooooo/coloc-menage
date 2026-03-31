import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const achievements = [
  // Tâches complétées
  { name: 'Première tâche', description: 'Complète ta première tâche', icon: '🌱', condition: 'tasks_completed:1', reward: 5 },
  { name: 'Travailleur', description: 'Complète 10 tâches', icon: '💪', condition: 'tasks_completed:10', reward: 15 },
  { name: 'Machine à ménage', description: 'Complète 25 tâches', icon: '🧹', condition: 'tasks_completed:25', reward: 30 },
  { name: 'Légende du foyer', description: 'Complète 50 tâches', icon: '👑', condition: 'tasks_completed:50', reward: 50 },
  { name: 'Centurion', description: 'Complète 100 tâches', icon: '🏛️', condition: 'tasks_completed:100', reward: 100 },

  // Tâches difficiles
  { name: 'Courageux', description: 'Complète 1 tâche difficile', icon: '🔥', condition: 'hard_tasks:1', reward: 10 },
  { name: 'Guerrier', description: 'Complète 10 tâches difficiles', icon: '⚔️', condition: 'hard_tasks:10', reward: 30 },
  { name: 'Boss final', description: 'Complète 25 tâches difficiles', icon: '🐉', condition: 'hard_tasks:25', reward: 75 },

  // Streaks
  { name: '3 jours de suite', description: 'Maintiens un streak de 3 jours', icon: '🔥', condition: 'streak:3', reward: 10 },
  { name: 'Semaine parfaite', description: 'Maintiens un streak de 7 jours', icon: '⭐', condition: 'streak:7', reward: 25 },
  { name: 'Deux semaines', description: 'Maintiens un streak de 14 jours', icon: '💎', condition: 'streak:14', reward: 50 },
  { name: 'Un mois !', description: 'Maintiens un streak de 30 jours', icon: '🏆', condition: 'streak:30', reward: 100 },

  // Niveaux
  { name: 'Niveau 5', description: 'Atteins le niveau 5', icon: '📈', condition: 'level:5', reward: 15 },
  { name: 'Niveau 10', description: 'Atteins le niveau 10', icon: '🚀', condition: 'level:10', reward: 40 },
  { name: 'Niveau 20', description: 'Atteins le niveau 20', icon: '🌟', condition: 'level:20', reward: 80 },

  // Monnaie
  { name: 'Épargnant', description: 'Accumule 100 coins', icon: '🪙', condition: 'coins:100', reward: 0 },
  { name: 'Riche', description: 'Accumule 500 coins', icon: '💰', condition: 'coins:500', reward: 0 },
]

// === Items avatar gratuits (de base pour tous les users) ===
const freeAvatarItems = [
  // Cheveux
  { name: 'Court noir', layer: 'hair', spriteName: 'short-black', rarity: 'common' },
  { name: 'Court brun', layer: 'hair', spriteName: 'short-brown', rarity: 'common' },
  { name: 'Mi-long brun', layer: 'hair', spriteName: 'medium-brown', rarity: 'common' },
  { name: 'Long noir', layer: 'hair', spriteName: 'long-black', rarity: 'common' },

  // Yeux
  { name: 'Classique', layer: 'eyes', spriteName: 'default', rarity: 'common' },
  { name: 'Endormi', layer: 'eyes', spriteName: 'sleepy', rarity: 'common' },

  // Hauts
  { name: 'T-shirt blanc', layer: 'top', spriteName: 'tshirt-white', rarity: 'common' },
  { name: 'T-shirt noir', layer: 'top', spriteName: 'tshirt-black', rarity: 'common' },
  { name: 'Hoodie gris', layer: 'top', spriteName: 'hoodie-grey', rarity: 'common' },

  // Bas
  { name: 'Cargo noir', layer: 'bottom', spriteName: 'cargo-black', rarity: 'common' },
  { name: 'Jean bleu', layer: 'bottom', spriteName: 'jean-blue', rarity: 'common' },
  { name: 'Jean noir', layer: 'bottom', spriteName: 'jean-black', rarity: 'common' },

  // Chaussures
  { name: 'Sneakers blanches', layer: 'shoes', spriteName: 'sneakers-white', rarity: 'common' },
  { name: 'Converse noires', layer: 'shoes', spriteName: 'converse-black', rarity: 'common' },
]

// === Items payants (boutique) ===
const paidAvatarItems = [
  // Cheveux premium
  { name: 'Buzz blond', layer: 'hair', spriteName: 'buzz-blonde', rarity: 'rare', price: 20 },
  { name: 'Afro noir', layer: 'hair', spriteName: 'afro-black', rarity: 'rare', price: 25 },

  // Yeux premium
  { name: 'Ronds', layer: 'eyes', spriteName: 'round', rarity: 'rare', price: 15 },

  // Hauts premium
  { name: 'Oversized beige', layer: 'top', spriteName: 'oversized-beige', rarity: 'rare', price: 30 },
  { name: 'Bomber navy', layer: 'top', spriteName: 'bomber-navy', rarity: 'epic', price: 50 },

  // Bas premium
  { name: 'Cargo camo', layer: 'bottom', spriteName: 'cargo-camo', rarity: 'rare', price: 25 },

  // Chaussures premium
  { name: 'Timberland tan', layer: 'shoes', spriteName: 'timbs-tan', rarity: 'rare', price: 35 },

  // Accessoires (tous payants)
  { name: 'Casquette noire', layer: 'accessory', spriteName: 'cap-black', rarity: 'common', price: 15 },
  { name: 'Casquette camo', layer: 'accessory', spriteName: 'cap-camo', rarity: 'rare', price: 25 },
  { name: 'Lunettes rondes', layer: 'accessory', spriteName: 'glasses-round', rarity: 'rare', price: 20 },
  { name: 'Casque audio', layer: 'accessory', spriteName: 'headphones-black', rarity: 'epic', price: 45 },
  { name: 'Cagoule noire', layer: 'accessory', spriteName: 'balaclava-black', rarity: 'legendary', price: 80 },
]

async function main() {
  console.log('Seeding achievements...')

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { id: a.name }, // fallback: on utilise create si pas d'id
      update: {},
      create: a,
    }).catch(() => prisma.achievement.create({ data: a }))
  }

  console.log(`${achievements.length} achievements créés !`)

  // Seed des items avatar gratuits
  console.log('Seeding avatar items...')

  for (const item of freeAvatarItems) {
    const existing = await prisma.shopItem.findFirst({
      where: { spriteName: item.spriteName, layer: item.layer },
    })
    if (!existing) {
      await prisma.shopItem.create({
        data: {
          name: item.name,
          type: 'avatar_part',
          layer: item.layer,
          spriteName: item.spriteName,
          rarity: item.rarity,
          price: 0,
          isFree: true,
        },
      })
    }
  }

  console.log(`${freeAvatarItems.length} items gratuits vérifiés/créés`)

  // Seed des items payants
  for (const item of paidAvatarItems) {
    const existing = await prisma.shopItem.findFirst({
      where: { spriteName: item.spriteName, layer: item.layer },
    })
    if (!existing) {
      await prisma.shopItem.create({
        data: {
          name: item.name,
          type: 'avatar_part',
          layer: item.layer,
          spriteName: item.spriteName,
          rarity: item.rarity,
          price: item.price,
          isFree: false,
        },
      })
    }
  }

  console.log(`${paidAvatarItems.length} items payants vérifiés/créés`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
