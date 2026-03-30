export const XP_REWARDS: Record<string, number> = {
  easy: 20,
  medium: 50,
  hard: 100,
}

export function getLevel(xp: number): number {
  // Niveau 1 à 0 XP, puis +150 XP par niveau
  return Math.floor(xp / 150) + 1
}

export function getXpForNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevel(xp)
  const xpStart = (level - 1) * 150
  const xpEnd = level * 150
  const current = xp - xpStart
  const needed = xpEnd - xpStart
  const percent = Math.round((current / needed) * 100)
  return { current, needed, percent }
}

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
