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

async function main() {
  console.log('Seeding achievements...')

  for (const a of achievements) {
    await prisma.achievement.create({ data: a })
  }

  console.log(`${achievements.length} achievements créés !`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
