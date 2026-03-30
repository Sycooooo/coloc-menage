import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const templates = [
  // === MÉNAGE ===
  // Salon
  { title: 'Passer l\'aspirateur au salon', category: 'cleaning', room: 'salon', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Dépoussiérer les meubles du salon', category: 'cleaning', room: 'salon', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Nettoyer les vitres du salon', category: 'cleaning', room: 'salon', difficulty: 'medium', recurrence: 'monthly' },
  { title: 'Passer la serpillère au salon', category: 'cleaning', room: 'salon', difficulty: 'medium', recurrence: 'weekly' },
  { title: 'Ranger le salon', category: 'cleaning', room: 'salon', difficulty: 'easy', recurrence: 'daily' },

  // Cuisine
  { title: 'Faire la vaisselle', category: 'cleaning', room: 'cuisine', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Nettoyer le plan de travail', category: 'cleaning', room: 'cuisine', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Nettoyer le four', category: 'cleaning', room: 'cuisine', difficulty: 'hard', recurrence: 'monthly' },
  { title: 'Nettoyer le frigo', category: 'cleaning', room: 'cuisine', difficulty: 'hard', recurrence: 'monthly' },
  { title: 'Vider et nettoyer la poubelle', category: 'cleaning', room: 'cuisine', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Nettoyer la hotte aspirante', category: 'cleaning', room: 'cuisine', difficulty: 'hard', recurrence: 'monthly' },
  { title: 'Passer l\'aspirateur dans la cuisine', category: 'cleaning', room: 'cuisine', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Dégivrer le congélateur', category: 'cleaning', room: 'cuisine', difficulty: 'hard', recurrence: 'monthly' },
  { title: 'Nettoyer le micro-ondes', category: 'cleaning', room: 'cuisine', difficulty: 'easy', recurrence: 'weekly' },

  // Salle de bain
  { title: 'Nettoyer les toilettes', category: 'cleaning', room: 'sdb', difficulty: 'medium', recurrence: 'weekly' },
  { title: 'Nettoyer la douche/baignoire', category: 'cleaning', room: 'sdb', difficulty: 'medium', recurrence: 'weekly' },
  { title: 'Nettoyer le lavabo', category: 'cleaning', room: 'sdb', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Nettoyer le miroir de la salle de bain', category: 'cleaning', room: 'sdb', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Laver les serviettes', category: 'cleaning', room: 'sdb', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Détartrer la robinetterie', category: 'cleaning', room: 'sdb', difficulty: 'medium', recurrence: 'monthly' },

  // Chambre
  { title: 'Changer les draps', category: 'cleaning', room: 'chambre', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Passer l\'aspirateur dans la chambre', category: 'cleaning', room: 'chambre', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Ranger sa chambre', category: 'cleaning', room: 'chambre', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Dépoussiérer la chambre', category: 'cleaning', room: 'chambre', difficulty: 'easy', recurrence: 'weekly' },

  // Extérieur / commun
  { title: 'Passer l\'aspirateur dans les couloirs', category: 'cleaning', room: 'exterieur', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Nettoyer l\'entrée', category: 'cleaning', room: 'exterieur', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Sortir les poubelles', category: 'cleaning', room: 'exterieur', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Nettoyer le balcon/terrasse', category: 'cleaning', room: 'exterieur', difficulty: 'medium', recurrence: 'monthly' },

  // === CUISINE (préparer à manger) ===
  { title: 'Préparer le petit-déjeuner pour la coloc', category: 'cooking', room: 'cuisine', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Préparer le déjeuner', category: 'cooking', room: 'cuisine', difficulty: 'medium', recurrence: 'daily' },
  { title: 'Préparer le dîner', category: 'cooking', room: 'cuisine', difficulty: 'medium', recurrence: 'daily' },
  { title: 'Préparer un gâteau/dessert', category: 'cooking', room: 'cuisine', difficulty: 'medium', recurrence: 'weekly' },
  { title: 'Faire les courses de la semaine', category: 'cooking', room: 'exterieur', difficulty: 'hard', recurrence: 'weekly' },
  { title: 'Préparer les repas de la semaine (meal prep)', category: 'cooking', room: 'cuisine', difficulty: 'hard', recurrence: 'weekly' },
  { title: 'Ranger les courses', category: 'cooking', room: 'cuisine', difficulty: 'easy', recurrence: 'weekly' },

  // === SPORT ===
  { title: 'Faire 30 minutes de sport', category: 'sport', difficulty: 'medium', recurrence: 'daily' },
  { title: 'Faire une session de musculation', category: 'sport', difficulty: 'hard', recurrence: 'weekly' },
  { title: 'Aller courir (30 min minimum)', category: 'sport', difficulty: 'hard', recurrence: 'weekly' },
  { title: 'Faire 20 minutes d\'étirements', category: 'sport', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Faire une session de yoga', category: 'sport', difficulty: 'medium', recurrence: 'weekly' },
  { title: 'Faire 50 pompes dans la journée', category: 'sport', difficulty: 'medium', recurrence: 'daily' },
  { title: 'Marcher 10 000 pas', category: 'sport', difficulty: 'medium', recurrence: 'daily' },
  { title: 'Faire du sport en groupe (coloc)', category: 'sport', difficulty: 'hard', recurrence: 'weekly' },

  // === ENTRETIEN MAISON ===
  { title: 'Vérifier les détecteurs de fumée', category: 'maintenance', difficulty: 'easy', recurrence: 'monthly' },
  { title: 'Changer les ampoules grillées', category: 'maintenance', difficulty: 'easy', recurrence: 'monthly' },
  { title: 'Déboucher un siphon', category: 'maintenance', room: 'sdb', difficulty: 'medium', recurrence: 'monthly' },
  { title: 'Purger les radiateurs', category: 'maintenance', difficulty: 'medium', recurrence: 'monthly' },
  { title: 'Nettoyer le filtre de la machine à laver', category: 'maintenance', difficulty: 'easy', recurrence: 'monthly' },
  { title: 'Dépoussiérer les grilles de ventilation', category: 'maintenance', difficulty: 'easy', recurrence: 'monthly' },
  { title: 'Arroser les plantes', category: 'maintenance', room: 'salon', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Lancer une machine de linge commun', category: 'maintenance', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Étendre/plier le linge', category: 'maintenance', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Repasser le linge', category: 'maintenance', difficulty: 'medium', recurrence: 'weekly' },

  // === ADMINISTRATIF ===
  { title: 'Relever le courrier', category: 'admin', room: 'exterieur', difficulty: 'easy', recurrence: 'daily' },
  { title: 'Payer les factures communes', category: 'admin', difficulty: 'medium', recurrence: 'monthly' },
  { title: 'Faire le point budget coloc', category: 'admin', difficulty: 'medium', recurrence: 'monthly' },
  { title: 'Vérifier les stocks (PQ, sopalin, produits ménagers)', category: 'admin', room: 'cuisine', difficulty: 'easy', recurrence: 'weekly' },
  { title: 'Racheter les produits manquants', category: 'admin', room: 'exterieur', difficulty: 'medium', recurrence: 'weekly' },
]

async function main() {
  console.log('Seeding quest templates...')

  for (const t of templates) {
    await prisma.questTemplate.create({ data: t })
  }

  console.log(`${templates.length} templates créés !`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
