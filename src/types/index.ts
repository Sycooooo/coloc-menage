// === Types centralisés de l'application ===
// Ce fichier regroupe toutes les "formes" de données utilisées dans l'app.
// Quand tu vois "type", ça veut dire : "voici à quoi ressemble cette donnée".

// --- Utilisateur ---
export type User = {
  id: string
  username: string
  avatar: string | null
  xp: number
  createdAt: Date
}

// Version allégée (quand on a juste besoin du nom, ex: liste de membres)
export type UserSummary = {
  id: string
  username: string
  avatar: string | null
}

// --- Colocation ---
export type Colocation = {
  id: string
  name: string
  inviteCode: string
  createdAt: Date
}

// --- Membre d'une coloc ---
export type Member = {
  id: string
  name: string
}

export type UserColoc = {
  id: string
  role: string
  joinedAt: Date
  userId: string
  colocId: string
  user: UserSummary
}

// --- Tâche ---
export type Task = {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string
  category: string | null
  room: string | null
  recurrence: string | null
  dueDate: Date | null
  createdAt: Date
  colocId: string
  assignedToId: string | null
  assignedTo: UserSummary | null
}

// --- Historique de tâche ---
export type TaskHistory = {
  id: string
  completedAt: Date
  taskId: string
  completedById: string
}

// --- Score (points par utilisateur par coloc) ---
export type Score = {
  id: string
  points: number
  userId: string
  colocId: string
  user: UserSummary
}
