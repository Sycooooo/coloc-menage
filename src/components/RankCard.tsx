'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type RankInfo, RANKS, RANK_THRESHOLDS } from '@/lib/ranking'
import RankBadge from './RankBadge'
import RankEmblem from './RankEmblem'

function AllRanksModal({
  open,
  onClose,
  currentTier,
}: {
  open: boolean
  onClose: () => void
  currentTier: number
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-lg border border-b max-w-md w-full max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface/90 backdrop-blur-sm border-b border-b p-4 flex items-center justify-between z-10">
              <h2 className="font-display text-xl tracking-wide text-t-primary uppercase neon-title">
                Tous les rangs
              </h2>
              <button
                onClick={onClose}
                className="text-t-muted hover:text-t-primary transition text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Grille des rangs */}
            <div className="p-4 space-y-2">
              {RANKS.map((rank, i) => {
                const isCurrent = i === currentTier
                const isLocked = i > currentTier
                const xpNeeded = RANK_THRESHOLDS[i]

                return (
                  <div key={rank.tier}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`relative flex items-center gap-4 rounded-xl px-4 py-3 transition ${
                        isLocked ? 'opacity-40' : ''
                      }`}
                      style={{
                        backgroundColor: isCurrent ? `${rank.color}15` : undefined,
                        boxShadow: isCurrent ? `0 0 0 2px ${rank.color}80` : undefined,
                      } as React.CSSProperties}
                    >
                      {/* Emblème */}
                      <div className={`flex-shrink-0 ${isLocked ? 'grayscale' : ''}`}>
                        <RankEmblem tier={rank.tier} size={56} />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold text-sm"
                            style={{ color: isLocked ? undefined : rank.color }}
                          >
                            {rank.name}
                          </span>
                          {isCurrent && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: `${rank.color}25`,
                                color: rank.color,
                              }}
                            >
                              Actuel
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-t-faint stat-number mt-0.5">
                          {i < 7 ? `${xpNeeded.toLocaleString()} – ${(RANK_THRESHOLDS[i + 1] - 1).toLocaleString()} RP` : `${xpNeeded.toLocaleString()}+ RP`}
                        </p>
                        {i < 7 && (
                          <p className="text-[10px] text-t-faint mt-0.5">
                            4 divisions (IV → I)
                          </p>
                        )}
                      </div>

                      {/* Cadenas ou check */}
                      <div className="flex-shrink-0 text-lg">
                        {isLocked ? '🔒' : isCurrent ? '▸' : '✓'}
                      </div>
                    </motion.div>

                    {/* Chevron entre les rangs */}
                    {i < RANKS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <svg width="12" height="12" viewBox="0 0 12 12" className="text-t-faint opacity-30">
                          <path d="M3 1 L6 5 L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" transform="rotate(90, 6, 5)" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer info */}
            <div className="border-t border-b p-4">
              <p className="text-xs text-t-faint text-center">
                Saison de 60 jours · Soft reset entre saisons · Récompenses au rang final
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function RankCard({
  rank,
  seasonNumber,
}: {
  rank: RankInfo
  seasonNumber: number
}) {
  const [showAll, setShowAll] = useState(false)

  const nextRank = rank.isMaxRank ? null : RANKS[
    rank.divisionIndex === 3 ? rank.tier + 1 : rank.tier
  ]

  return (
    <>
      <div className="card card-glow p-5 relative overflow-hidden backdrop-blur-sm">
        {/* Glow de fond */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${rank.color}, transparent 70%)`,
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-t-primary">Rang Compétitif</h3>
            <span className="text-xs text-t-faint">Saison {seasonNumber}</span>
          </div>

          {/* Rang actuel */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <RankEmblem tier={rank.tier} size={96} />
            </motion.div>
            <RankBadge rank={rank} size="lg" />
            <p className="text-xs text-t-faint stat-number">{rank.points} RP</p>
          </div>

          {/* Barre de progression */}
          {!rank.isMaxRank && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-t-faint stat-number">
                  {rank.points} RP
                </span>
                <span className="text-xs text-t-faint stat-number">
                  {rank.pointsForNextDiv} RP
                </span>
              </div>
              <div className="w-full bg-[#0a0a14]/50 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rank.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-3 rounded-full"
                  style={{
                    backgroundColor: rank.color,
                    boxShadow: `0 0 12px ${rank.glow}`,
                  }}
                />
              </div>
              {nextRank && rank.divisionIndex === 3 && (
                <p className="text-xs text-t-faint mt-2 text-center">
                  Prochain : {nextRank.icon} {nextRank.name}
                </p>
              )}
            </div>
          )}

          {rank.isMaxRank && (
            <p
              className="text-center text-sm font-bold mt-2"
              style={{ color: rank.color, textShadow: `0 0 20px ${rank.glow}` }}
            >
              Rang maximum atteint
            </p>
          )}

          {/* Bouton voir tous les rangs */}
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 w-full py-2 rounded-lg text-sm font-medium text-t-muted hover:text-t-primary bg-surface-hover hover:bg-surface border border-b transition"
          >
            Voir tous les rangs
          </button>
        </div>
      </div>

      {/* Modal tous les rangs */}
      <AllRanksModal open={showAll} onClose={() => setShowAll(false)} currentTier={rank.tier} />
    </>
  )
}
