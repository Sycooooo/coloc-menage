// === Système de récompenses ===

// XP gagnés par difficulté
export const XP_REWARDS: Record<string, number> = {
  easy: 20,
  medium: 50,
  hard: 100,
}

// Coins gagnés par difficulté (seulement medium et hard)
export const COIN_REWARDS: Record<string, number> = {
  easy: 0,
  medium: 5,
  hard: 15,
}

// Multiplicateur de streak (jours consécutifs -> bonus XP)
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3
  if (streak >= 14) return 2.5
  if (streak >= 7) return 2
  if (streak >= 3) return 1.5
  return 1
}

// === Système de niveaux (courbe progressive) ===

// XP nécessaire pour passer du niveau N au niveau N+1
export function getXpRequiredForLevel(level: number): number {
  return 100 + level * 50
}

// Calcule le niveau actuel à partir des XP totaux
export function getLevel(xp: number): number {
  let level = 1
  let xpRemaining = xp
  while (xpRemaining >= getXpRequiredForLevel(level)) {
    xpRemaining -= getXpRequiredForLevel(level)
    level++
  }
  return level
}

// Calcule la progression vers le prochain niveau
export function getXpForNextLevel(xp: number): { current: number; needed: number; percent: number } {
  let xpRemaining = xp
  let level = 1
  while (xpRemaining >= getXpRequiredForLevel(level)) {
    xpRemaining -= getXpRequiredForLevel(level)
    level++
  }
  const needed = getXpRequiredForLevel(level)
  const percent = Math.round((xpRemaining / needed) * 100)
  return { current: xpRemaining, needed, percent }
}

// === Labels et couleurs ===

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30',
  medium: 'bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30',
  hard: 'bg-accent-tertiary/15 text-accent-tertiary border border-accent-tertiary/30',
}

export const CATEGORY_LABELS: Record<string, string> = {
  cleaning: 'Ménage',
  cooking: 'Cuisine',
  sport: 'Sport',
  maintenance: 'Entretien',
  admin: 'Administratif',
}

export const CATEGORY_ICONS: Record<string, string> = {
  cleaning: '🧹',
  cooking: '🍳',
  sport: '💪',
  maintenance: '🔧',
  admin: '📋',
}

export const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  cuisine: 'Cuisine',
  sdb: 'Salle de bain',
  chambre: 'Chambre',
  exterieur: 'Extérieur',
}

export const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

export const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
  rare: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  epic: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  legendary: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}
