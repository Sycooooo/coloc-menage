import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLevel, getXpForNextLevel, getStreakMultiplier } from '@/lib/xp'
import { getRankFromPoints } from '@/lib/ranking'
import Link from 'next/link'
import AvatarUpload from '@/components/AvatarUpload'
import PixelAvatar from '@/components/PixelAvatar'
import RankCard from '@/components/RankCard'
import PageAmbiance from '@/components/ui/PageAmbiance'
import PageTransition from '@/components/PageTransition'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      completedTasks: { include: { task: true } },
      achievements: { include: { achievement: true } },
      avatarConfig: true,
    },
  })

  if (!user) redirect('/login')

  const level = getLevel(user.xp)
  const xpInfo = getXpForNextLevel(user.xp)
  const totalCompleted = user.completedTasks.length
  const streakMultiplier = getStreakMultiplier(user.currentStreak)
  const rank = getRankFromPoints(user.rankPoints)

  // Tous les achievements pour afficher ceux non débloqués aussi
  const allAchievements = await prisma.achievement.findMany()
  const unlockedIds = new Set(user.achievements.map((a) => a.achievementId))

  return (
    <div className="min-h-screen relative z-10" data-room="profil">
      <PageAmbiance theme="profil" />
      <header className="glass-header sticky top-0 z-40 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-t-muted hover:text-t-primary transition">←</Link>
        <h1 className="font-display text-2xl tracking-wide text-t-primary uppercase neon-title">Mon profil</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-5">
        <PageTransition>
        {/* Carte profil */}
        <div className="card card-glow gradient-border p-6 flex flex-col items-center gap-4">
          {user.avatarConfig ? (
            <PixelAvatar
              config={{
                skinTone: user.avatarConfig.skinTone,
                body: user.avatarConfig.body,
                hair: user.avatarConfig.hair,
                eyes: user.avatarConfig.eyes,
                top: user.avatarConfig.top,
                bottom: user.avatarConfig.bottom,
                shoes: user.avatarConfig.shoes,
                accessory: user.avatarConfig.accessory,
              }}
              username={user.username}
              size="lg"
            />
          ) : (
            <AvatarUpload
              currentAvatar={user.avatar}
              username={user.username}
            />
          )}
          <h2 className="font-display text-3xl tracking-wide text-t-primary uppercase neon-title">{user.username}</h2>

          {/* Boutons avatar */}
          <div className="flex gap-2 flex-wrap justify-center">
            <Link
              href="/profile/character"
              className="px-4 py-2 bg-accent-secondary hover:bg-accent-secondary-hover text-white rounded-full text-sm font-bold transition"
            >
              Personnaliser
            </Link>
            <Link
              href="/shop"
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-sm font-bold transition"
            >
              Boutique 🛒
            </Link>
            <Link
              href="/profile/settings"
              className="px-4 py-2 bg-surface-hover hover:bg-surface border border-b text-t-primary rounded-full text-sm font-bold transition"
            >
              Paramètres
            </Link>
          </div>

          {/* Badge niveau */}
          <div className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-full text-lg font-bold badge-neon">
            ⭐ Niveau <span className="stat-number ml-1">{level}</span>
          </div>
        </div>

        {/* Barre XP */}
        <div className="card card-glow p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-t-primary">Expérience</span>
            <span className="text-sm text-t-muted stat-number">{user.xp} XP total</span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-accent rounded-full transition-all"
              style={{ width: `${xpInfo.percent}%`, boxShadow: '0 0 12px var(--glow-accent)' }}
            />
          </div>
          <div className="flex justify-between text-xs text-t-faint mt-1 stat-number">
            <span>{xpInfo.current} XP</span>
            <span>{xpInfo.needed} XP pour le niveau {level + 1}</span>
          </div>
        </div>

        {/* Rang Compétitif */}
        <RankCard rank={rank} seasonNumber={user.seasonNumber} />

        {/* Stats */}
        <div className="card card-glow p-5">
          <h3 className="font-semibold text-t-primary mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-accent/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-accent stat-number">{totalCompleted}</p>
              <p className="text-sm text-t-muted mt-1">Tâches accomplies</p>
            </div>
            <div className="bg-accent-secondary/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-accent-secondary stat-number">{user.xp}</p>
              <p className="text-sm text-t-muted mt-1">XP totaux</p>
            </div>
            <div className="bg-accent/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-accent stat-number">{user.currency}</p>
              <p className="text-sm text-t-muted mt-1">🪙 Coins</p>
            </div>
            <div className="bg-accent-secondary/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-accent-secondary stat-number">{user.currentStreak}</p>
              <p className="text-sm text-t-muted mt-1">🔥 Streak (jours)</p>
              {streakMultiplier > 1 && (
                <p className="text-xs text-accent-secondary mt-1 font-medium stat-number">Bonus x{streakMultiplier}</p>
              )}
            </div>
          </div>
          {user.longestStreak > 0 && (
            <p className="text-xs text-t-faint text-center mt-3 stat-number">
              Record : {user.longestStreak} jours de suite
            </p>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-[#161628]/60 backdrop-blur-lg rounded-xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow)' }}>
          <h3 className="font-semibold text-t-primary mb-4">
            Achievements ({user.achievements.length}/{allAchievements.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {allAchievements.map((achievement) => {
              const unlocked = unlockedIds.has(achievement.id)
              return (
                <div
                  key={achievement.id}
                  className={`rounded-lg p-3 text-center border ${
                    unlocked
                      ? 'bg-[#1e1e38]/95 border-accent/30'
                      : 'bg-[#161628]/55 border-[var(--border)] text-t-faint'
                  }`}
                >
                  <div className="text-2xl mb-1">{achievement.icon}</div>
                  <p className="text-xs font-medium text-t-primary">{achievement.name}</p>
                  <p className="text-xs text-t-faint mt-0.5">{achievement.description}</p>
                  {achievement.reward > 0 && unlocked && (
                    <p className="text-xs text-accent mt-1">+{achievement.reward} 🪙</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Récompenses par tâche */}
        <div className="bg-[#161628]/60 backdrop-blur-lg rounded-xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow)' }}>
          <h3 className="font-semibold text-t-primary mb-3">Récompenses par tâche</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-[#4ade80]/15 text-[#4ade80] rounded-full text-sm font-medium">Facile</span>
              <span className="font-bold text-t-muted">+20 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-accent-secondary/15 text-accent-secondary rounded-full text-sm font-medium">Moyen</span>
              <span className="font-bold text-t-muted">+50 XP · +5 🪙</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-accent-tertiary/15 text-accent-tertiary rounded-full text-sm font-medium">Difficile</span>
              <span className="font-bold text-t-muted">+100 XP · +15 🪙</span>
            </div>
          </div>
        </div>

        </PageTransition>
      </main>
    </div>
  )
}
