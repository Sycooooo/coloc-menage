'use client'

import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { smooth } from '@/lib/animations'

type Article = {
  title: string
  prose: string
  histBox?: string
  winners?: string
  losers?: string
  impact: string
}

type Section = {
  type: 'fr' | 'world' | 'hist' | 'radar'
  title: string
  icon: string
  articles: Article[]
}

type Source = {
  title: string
  url: string
}

type Props = {
  sections: Section[]
  sources: Source[]
  evalText: string | null
  score: number
}

const SECTION_COLORS: Record<string, { text: string; bg: string; border: string; solidBg: string }> = {
  fr: { text: 'text-blue-400', bg: 'bg-[#111827]', border: 'border-[#1e3a5f]', solidBg: 'bg-[#0f1a2e]' },
  world: { text: 'text-emerald-400', bg: 'bg-[#0f1f1a]', border: 'border-[#1a3d2e]', solidBg: 'bg-[#0d1a16]' },
  hist: { text: 'text-amber-400', bg: 'bg-[#1a1508]', border: 'border-[#3d2f0a]', solidBg: 'bg-[#171308]' },
  radar: { text: 'text-purple-400', bg: 'bg-[#1a1028]', border: 'border-[#2d1a4a]', solidBg: 'bg-[#160e22]' },
}

function renderMarkdown(text: string) {
  // Simple bold (**text**) and italic (*text*) rendering
  const parts: (string | ReactNode)[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="text-t-primary font-semibold">{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(<em key={match.index}>{match[2]}</em>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

function ArticleCard({ article, colors }: { article: Article; colors: (typeof SECTION_COLORS)[string] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${colors.solidBg} hover:brightness-125 transition`}
      >
        <span className="text-sm font-semibold text-t-primary pr-4">{article.title}</span>
        <span className={`${colors.text} text-lg shrink-0`}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={smooth}
          className="px-4 py-4 space-y-4 bg-[#0a0a14]"
        >
          {/* Prose */}
          <p className="text-sm text-t-muted leading-relaxed">
            {renderMarkdown(article.prose)}
          </p>

          {/* Historical context */}
          {article.histBox && (
            <div className="rounded-lg border border-[#3d2f0a] bg-[#171308] p-3 border-l-2 border-l-amber-400">
              <p className="font-pixel text-[9px] text-amber-400 uppercase tracking-wider mb-2">Contexte historique</p>
              <p className="text-xs text-t-muted leading-relaxed">{renderMarkdown(article.histBox)}</p>
            </div>
          )}

          {/* Winners / Losers */}
          {(article.winners || article.losers) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.winners && (
                <div className="rounded-lg border border-[#1a3d2e] bg-[#0d1a16] p-3">
                  <p className="font-pixel text-[9px] text-emerald-400 uppercase tracking-wider mb-2">Renforcé(s)</p>
                  <p className="text-xs text-t-muted leading-relaxed">{renderMarkdown(article.winners)}</p>
                </div>
              )}
              {article.losers && (
                <div className="rounded-lg border border-[#3d1a1a] bg-[#1a0d0d] p-3">
                  <p className="font-pixel text-[9px] text-red-400 uppercase tracking-wider mb-2">Affaibli(s)</p>
                  <p className="text-xs text-t-muted leading-relaxed">{renderMarkdown(article.losers)}</p>
                </div>
              )}
            </div>
          )}

          {/* Impact / So What */}
          {article.impact && (
            <div className={`rounded-lg border ${colors.border} ${colors.solidBg} p-3 border-l-2`} style={{ borderLeftColor: 'currentColor' }}>
              <p className={`font-pixel text-[9px] ${colors.text} uppercase tracking-wider mb-2`}>So What ?</p>
              <p className="text-xs text-t-muted leading-relaxed">{renderMarkdown(article.impact)}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function BriefingView({ sections, sources, evalText, score }: Props) {
  const [showSources, setShowSources] = useState(false)
  const [showEval, setShowEval] = useState(false)

  return (
    <div className="space-y-6">
      {/* Score badge */}
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[10px] px-2 py-1 rounded border border-[#1a3d2e] bg-[#0d1a16] text-emerald-400">
          SIA {score}/10
        </span>
        <span className="text-xs text-t-faint">Intelligence Stratégique & Géopolitique</span>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const colors = SECTION_COLORS[section.type] || SECTION_COLORS.fr
        return (
          <div key={section.type} className="space-y-3">
            <div className={`flex items-center gap-2 ${colors.bg} px-3 py-2 rounded-lg`}>
              <span className="text-lg">{section.icon}</span>
              <h2 className={`font-pixel text-xs ${colors.text} uppercase tracking-wider`}>{section.title}</h2>
            </div>

            <div className="space-y-2 pl-1">
              {section.articles.map((article, i) => (
                <ArticleCard key={i} article={article} colors={colors} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div>
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-t-faint hover:text-t-muted transition flex items-center gap-1"
          >
            <span>{showSources ? '−' : '+'}</span>
            <span>{sources.length} sources</span>
          </button>
          {showSources && (
            <div className="mt-2 space-y-1 pl-3">
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-t-faint hover:text-accent transition truncate"
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-evaluation */}
      {evalText && (
        <div>
          <button
            onClick={() => setShowEval(!showEval)}
            className="text-xs text-t-faint hover:text-t-muted transition flex items-center gap-1"
          >
            <span>{showEval ? '−' : '+'}</span>
            <span>Auto-évaluation</span>
          </button>
          {showEval && (
            <p className="mt-2 text-xs text-t-faint leading-relaxed pl-3">{evalText}</p>
          )}
        </div>
      )}
    </div>
  )
}
