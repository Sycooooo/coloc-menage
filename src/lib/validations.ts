import { z } from 'zod'

// === Schémas de validation ===
// Chaque schéma décrit les règles que les données doivent respecter.
// Si les données ne respectent pas les règles, Zod renvoie une erreur claire.

// --- Inscription ---
export const registerSchema = z.object({
  username: z
    .string({ error: 'Identifiant requis' })
    .min(3, 'Identifiant trop court (3 caractères min)')
    .max(30, 'Identifiant trop long (30 caractères max)'),
  password: z
    .string({ error: 'Mot de passe requis' })
    .min(6, 'Mot de passe trop court (6 caractères min)'),
})

// --- Créer une colocation ---
export const createColocSchema = z.object({
  name: z
    .string({ error: 'Nom requis' })
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long'),
})

// --- Rejoindre une colocation ---
export const joinColocSchema = z.object({
  inviteCode: z
    .string({ error: 'Code requis' })
    .min(1, 'Code requis'),
})

// --- Créer une tâche ---
export const createTaskSchema = z.object({
  title: z
    .string({ error: 'Titre requis' })
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long'),
  description: z.string().max(1000, 'Description trop longue').optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  category: z.enum(['cleaning', 'cooking', 'sport', 'maintenance', 'admin']).optional().nullable(),
  room: z.enum([
    'sejour', 'cuisine', 'sdb', 'wc', 'chambre1', 'chambre2', 'chambre3',
    'couloir', 'buanderie', 'balcon', 'loggia',
    // legacy values (backward compat)
    'salon', 'chambre', 'exterieur',
  ]).optional().nullable(),
  colocId: z.string({ error: 'Colocation requise' }).min(1, 'Colocation requise'),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
})

// --- Créer une habitude ---
export const createHabitSchema = z.object({
  title: z.string({ error: 'Titre requis' }).min(1, 'Titre requis').max(100, 'Titre trop long'),
  description: z.string().max(500, 'Description trop longue').optional().nullable(),
  icon: z.string().max(4).default('✅'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  block: z.enum(['morning', 'afternoon', 'evening', 'anytime']).default('anytime'),
  colocId: z.string({ error: 'Colocation requise' }).min(1, 'Colocation requise'),
})

// --- Créer une dépense ---
export const createExpenseSchema = z.object({
  amount: z.number({ error: 'Montant requis' }).positive('Le montant doit être positif'),
  description: z
    .string({ error: 'Description requise' })
    .min(1, 'Description requise')
    .max(200, 'Description trop longue'),
  category: z.enum(['courses', 'loyer', 'sorties', 'menage', 'other']).default('other'),
  colocId: z.string({ error: 'Colocation requise' }).min(1, 'Colocation requise'),
  splitBetween: z.array(z.string()).min(1, 'Au moins un participant'),
  splitMethod: z.enum(['equal', 'exact', 'percentage', 'shares']).default('equal'),
  // Pour exact: { userId: montant }, pour percentage: { userId: % }, pour shares: { userId: nbParts }
  customSplits: z.record(z.string(), z.number()).optional(),
})

// --- Achat boutique ---
export const buyItemSchema = z.object({
  itemId: z.string({ error: 'Item requis' }).min(1, 'Item requis'),
})
