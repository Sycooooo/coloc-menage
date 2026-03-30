import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLevel, getXpForNextLevel, getStreakMultiplier } from '@/lib/xp'
import Link from 'next/link'
import AvatarUpload from '@/components/AvatarUpload'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      completedTasks: { include: { task: true } },
      achievements: { include: { achievement: true } },
    },
  })

  if (!user) redirect('/login')

  const level = getLevel(user.xp)
  const xpInfo = getXpForNextLevel(user.xp)
  const totalCompleted = user.completedTasks.length
  const streakMultiplier = getStreakMultiplier(user.currentStreak)

  // Tous les achievements pour afficher ceux non débloqués aussi
  const allAchievements = await prisma.achievement.findMany()
  const unlockedIds = new Set(user.achievements.map((a) => a.achievementId))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">←</Link>
        <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-5">

        {/* Carte profil */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4">
          <AvatarUpload
            currentAvatar={user.avatar}
            username={user.username}
          />
          <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>

          {/* Badge niveau */}
          <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-lg font-bold">
            ⭐ Niveau {level}
          </div>
        </div>

        {/* Barre XP */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-900">Expérience</span>
            <span className="text-sm text-gray-500">{user.xp} XP total</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${xpInfo.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{xpInfo.current} XP</span>
            <span>{xpInfo.needed} XP pour le niveau {level + 1}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{totalCompleted}</p>
              <p className="text-sm text-gray-500 mt-1">Tâches accomplies</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{user.xp}</p>
              <p className="text-sm text-gray-500 mt-1">XP totaux</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{user.currency}</p>
              <p className="text-sm text-gray-500 mt-1">🪙 Coins</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{user.currentStreak}</p>
              <p className="text-sm text-gray-500 mt-1">🔥 Streak (jours)</p>
              {streakMultiplier > 1 && (
                <p className="text-xs text-orange-500 mt-1 font-medium">Bonus x{streakMultiplier}</p>
              )}
            </div>
          </div>
          {user.longestStreak > 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Record : {user.longestStreak} jours de suite
            </p>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            Achievements ({user.achievements.length}/{allAchievements.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {allAchievements.map((achievement) => {
              const unlocked = unlockedIds.has(achievement.id)
              return (
                <div
                  key={achievement.id}
                  className={`rounded-xl p-3 text-center border ${
                    unlocked
                      ? 'bg-white border-indigo-200'
                      : 'bg-gray-50 border-gray-100 opacity-40'
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-xs font-medium text-gray-900">{achievement.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{achievement.description}</p>
                  {achievement.reward > 0 && unlocked && (
                    <p className="text-xs text-amber-600 mt-1">+{achievement.reward} 🪙</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Récompenses par tâche */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Récompenses par tâche</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Facile</span>
              <span className="font-bold text-gray-700">+20 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Moyen</span>
              <span className="font-bold text-gray-700">+50 XP · +5 🪙</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Difficile</span>
              <span className="font-bold text-gray-700">+100 XP · +15 🪙</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
