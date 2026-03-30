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
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

export const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-100 text-gray-700',
  rare: 'bg-blue-100 text-blue-700',
  epic: 'bg-purple-100 text-purple-700',
  legendary: 'bg-amber-100 text-amber-700',
}
