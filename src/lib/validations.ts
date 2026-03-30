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
  room: z.enum(['salon', 'cuisine', 'sdb', 'chambre', 'exterieur']).optional().nullable(),
  colocId: z.string({ error: 'Colocation requise' }).min(1, 'Colocation requise'),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
})
