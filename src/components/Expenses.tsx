'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'

type UserSummary = { id: string; username: string; avatar: string | null }
type Split = { id: string; amount: number; userId: string; user: UserSummary }
type Expense = {
  id: string
  amount: number
  description: string
  category: string
  paidBy: UserSummary
  paidById: string
  splits: Split[]
  createdAt: string
}
type MemberEntry = { userId: string; user: UserSummary }

type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares'

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'Courses',
  loyer: 'Loyer',
  sorties: 'Sorties',
  menage: 'Ménage',
  other: 'Autre',
}

const CATEGORY_ICONS: Record<string, string> = {
  courses: '🛒',
  loyer: '🏠',
  sorties: '🎉',
  menage: '🧹',
  other: '📦',
}

const SPLIT_METHOD_LABELS: Record<SplitMethod, string> = {
  equal: 'Parts égales',
  exact: 'Montants exacts',
  percentage: 'Par pourcentage',
  shares: 'Par parts',
}

const SPLIT_METHOD_ICONS: Record<SplitMethod, string> = {
  equal: '⚖️',
  exact: '💶',
  percentage: '📊',
  shares: '🍰',
}

const SPLIT_METHOD_DESC: Record<SplitMethod, string> = {
  equal: 'Tout le monde paie pareil',
  exact: 'Tu choisis le montant de chacun',
  percentage: 'Tu choisis le % de chacun',
  shares: 'Chacun a X parts (2 parts = paie double)',
}

export default function Expenses({
  colocId,
  currentUserId,
}: {
  colocId: string
  currentUserId: string
}) {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [members, setMembers] = useState<MemberEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDebts, setShowDebts] = useState(false)

  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchData() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/expenses`)
      setExpenses(data.expenses)
      setBalances(data.balances)
      setMembers(data.members)
      if (selectedMembers.length === 0 && data.members.length > 0) {
        setSelectedMembers(data.members.map((m: MemberEntry) => m.userId))
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colocId])

  // Quand la méthode ou les membres changent, reset les valeurs custom
  useEffect(() => {
    if (splitMethod === 'equal') return
    const defaults: Record<string, string> = {}
    for (const userId of selectedMembers) {
      if (splitMethod === 'shares') defaults[userId] = '1'
      else if (splitMethod === 'percentage') defaults[userId] = selectedMembers.length > 0 ? (100 / selectedMembers.length).toFixed(1) : '0'
      else defaults[userId] = ''
    }
    setCustomValues(defaults)
  }, [splitMethod, selectedMembers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function getCustomSplits(): Record<string, number> | undefined {
    if (splitMethod === 'equal') return undefined
    const splits: Record<string, number> = {}
    for (const userId of selectedMembers) {
      splits[userId] = parseFloat(customValues[userId] || '0') || 0
    }
    return splits
  }

  function getSplitPreview(): Record<string, number> {
    const parsedAmount = parseFloat(amount) || 0
    if (parsedAmount <= 0 || selectedMembers.length === 0) return {}

    if (splitMethod === 'equal') {
      const perPerson = parsedAmount / selectedMembers.length
      const result: Record<string, number> = {}
      for (const userId of selectedMembers) result[userId] = perPerson
      return result
    }

    if (splitMethod === 'exact') {
      const result: Record<string, number> = {}
      for (const userId of selectedMembers) {
        result[userId] = parseFloat(customValues[userId] || '0') || 0
      }
      return result
    }

    if (splitMethod === 'percentage') {
      const result: Record<string, number> = {}
      for (const userId of selectedMembers) {
        const pct = parseFloat(customValues[userId] || '0') || 0
        result[userId] = parsedAmount * pct / 100
      }
      return result
    }

    if (splitMethod === 'shares') {
      const totalShares = selectedMembers.reduce((s, uid) => s + (parseFloat(customValues[uid] || '0') || 0), 0)
      if (totalShares === 0) return {}
      const result: Record<string, number> = {}
      for (const userId of selectedMembers) {
        const shares = parseFloat(customValues[userId] || '0') || 0
        result[userId] = parsedAmount * shares / totalShares
      }
      return result
    }

    return {}
  }

  function isSplitValid(): boolean {
    if (selectedMembers.length === 0) return false
    const parsedAmount = parseFloat(amount) || 0
    if (parsedAmount <= 0) return false
    if (splitMethod === 'equal') return true

    const custom = getCustomSplits()
    if (!custom) return false

    if (splitMethod === 'exact') {
      const total = Object.values(custom).reduce((s, v) => s + v, 0)
      return Math.abs(total - parsedAmount) <= 0.02
    }
    if (splitMethod === 'percentage') {
      const total = Object.values(custom).reduce((s, v) => s + v, 0)
      return Math.abs(total - 100) <= 0.1
    }
    if (splitMethod === 'shares') {
      const total = Object.values(custom).reduce((s, v) => s + v, 0)
      return total > 0
    }
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !description) return
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/api/coloc/${colocId}/expenses`, {
        amount: parseFloat(amount),
        description,
        category,
        splitBetween: selectedMembers,
        splitMethod,
        customSplits: getCustomSplits(),
      })
      setAmount('')
      setDescription('')
      setCategory('other')
      setSplitMethod('equal')
      setCustomValues({})
      setShowForm(false)
      await fetchData()
      router.refresh()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    }
    setSubmitting(false)
  }

  async function handleDelete(expenseId: string) {
    try {
      await api.delete(`/api/coloc/${colocId}/expenses`, { expenseId })
      await fetchData()
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  function toggleMember(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  // Calcul des remboursements optimaux
  function getSettlements() {
    const debts: { from: string; to: string; amount: number }[] = []
    const positives: { userId: string; amount: number }[] = []
    const negatives: { userId: string; amount: number }[] = []

    for (const [userId, balance] of Object.entries(balances)) {
      if (balance > 0.01) positives.push({ userId, amount: balance })
      else if (balance < -0.01) negatives.push({ userId, amount: -balance })
    }

    positives.sort((a, b) => b.amount - a.amount)
    negatives.sort((a, b) => b.amount - a.amount)

    let i = 0
    let j = 0
    while (i < positives.length && j < negatives.length) {
      const transfer = Math.min(positives[i].amount, negatives[j].amount)
      if (transfer > 0.01) {
        debts.push({
          from: negatives[j].userId,
          to: positives[i].userId,
          amount: Math.round(transfer * 100) / 100,
        })
      }
      positives[i].amount -= transfer
      negatives[j].amount -= transfer
      if (positives[i].amount < 0.01) i++
      if (negatives[j].amount < 0.01) j++
    }

    return debts
  }

  // Dettes détaillées : pour chaque paire, combien A doit à B sur chaque dépense
  function getDetailedDebts() {
    const pairDebts: Record<string, { from: string; to: string; expenses: { description: string; amount: number; date: string }[] }> = {}

    for (const expense of expenses) {
      for (const split of expense.splits) {
        if (split.userId === expense.paidById) continue // On ne se doit pas à soi-même
        const key = `${split.userId}->${expense.paidById}`
        if (!pairDebts[key]) {
          pairDebts[key] = { from: split.userId, to: expense.paidById, expenses: [] }
        }
        pairDebts[key].expenses.push({
          description: expense.description,
          amount: split.amount,
          date: new Date(expense.createdAt).toLocaleDateString('fr-FR'),
        })
      }
    }

    return Object.values(pairDebts).map((d) => ({
      ...d,
      total: d.expenses.reduce((s, e) => s + e.amount, 0),
    }))
  }

  function getMemberName(userId: string) {
    return members.find((m) => m.userId === userId)?.user.username || '?'
  }

  if (loading) {
    return <div className="text-center py-8 text-t-faint">Chargement...</div>
  }

  const settlements = getSettlements()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const preview = getSplitPreview()

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card card-glow backdrop-blur-sm p-5 text-center">
          <p className="text-sm text-t-muted">Total dépenses</p>
          <p className="text-2xl font-bold text-t-primary mt-1 stat-number">{totalExpenses.toFixed(2)}€</p>
        </div>
        <div className="card card-glow backdrop-blur-sm p-5 text-center">
          <p className="text-sm text-t-muted">Nombre</p>
          <p className="text-2xl font-bold text-t-primary mt-1 stat-number">{expenses.length}</p>
        </div>
      </div>

      {/* Soldes */}
      <div className="card card-glow p-5">
        <h3 className="font-semibold text-t-primary mb-3">Soldes</h3>
        <div className="space-y-2">
          {members.map((m) => {
            const balance = balances[m.userId] || 0
            return (
              <div key={m.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                    {m.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-t-primary">{m.user.username}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    balance > 0.01
                      ? 'text-success'
                      : balance < -0.01
                        ? 'text-danger'
                        : 'text-t-faint'
                  }`}
                >
                  {balance > 0 ? '+' : ''}
                  {balance.toFixed(2)}€
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Remboursements optimaux */}
      {settlements.length > 0 && (
        <div className="bg-[#161628]/75 hover:bg-[#161628]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl p-5 transition-all" style={{ boxShadow: 'var(--shadow)' }}>
          <h3 className="font-semibold text-accent mb-3">Remboursements simplifiés</h3>
          <p className="text-xs text-accent mb-3">Le minimum de virements pour tout équilibrer</p>
          <div className="space-y-3">
            {settlements.map((s, i) => (
              <div key={i} className="bg-surface/60 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-danger/15 flex items-center justify-center text-xs font-medium text-danger">
                    {getMemberName(s.from)[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-t-primary">{getMemberName(s.from)}</span>
                  <span className="text-accent">→</span>
                  <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center text-xs font-medium text-success">
                    {getMemberName(s.to)[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-t-primary">{getMemberName(s.to)}</span>
                </div>
                <span className="font-bold text-accent">{s.amount.toFixed(2)}€</span>
              </div>
            ))}
          </div>

          {/* Bouton voir le détail */}
          <button
            onClick={() => setShowDebts(!showDebts)}
            className="mt-3 text-xs text-accent hover:text-accent underline transition"
          >
            {showDebts ? 'Masquer le détail' : 'Voir le détail de qui doit quoi'}
          </button>
        </div>
      )}

      {/* Détail des dettes par paire */}
      <AnimatePresence>
      {showDebts && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="card card-glow p-5 overflow-hidden"
        >
          <h3 className="font-semibold text-t-primary mb-4">Détail des dettes</h3>
          {getDetailedDebts().length === 0 ? (
            <p className="text-sm text-t-faint text-center py-2">Aucune dette</p>
          ) : (
            <div className="space-y-4">
              {getDetailedDebts().map((pair, i) => (
                <div key={i} className="border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-danger">{getMemberName(pair.from)}</span>
                      <span className="text-t-faint">doit à</span>
                      <span className="font-semibold text-success">{getMemberName(pair.to)}</span>
                    </div>
                    <span className="font-bold text-t-primary">{pair.total.toFixed(2)}€</span>
                  </div>
                  <div className="space-y-1.5">
                    {pair.expenses.map((exp, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-t-muted">
                        <span>{exp.description} ({exp.date})</span>
                        <span className="font-medium text-t-muted">{exp.amount.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Bouton ajouter */}
      <AnimatePresence mode="wait">
      {!showForm && (
        <motion.div
          key="add-btn"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Button
            onClick={() => setShowForm(true)}
            fullWidth
            size="lg"
          >
            + Ajouter une dépense
          </Button>
        </motion.div>
      )}

      {/* Formulaire */}
      {showForm && (
        <motion.form
          key="expense-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="card card-glow p-5 space-y-4 overflow-hidden"
        >
          <h3 className="font-semibold text-t-primary">Nouvelle dépense</h3>

          {error && (
            <div className="bg-danger-bg border border-danger/20 text-danger text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-t-muted block mb-1">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="12.50"
              required
            />
          </div>

          <div>
            <label className="text-sm text-t-muted block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Courses Carrefour"
              required
            />
          </div>

          <div>
            <label className="text-sm text-t-muted block mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {CATEGORY_ICONS[key]} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-t-muted block mb-1">Partagé entre</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <motion.button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={selectedMembers.includes(m.userId) ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.2 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedMembers.includes(m.userId)
                      ? 'bg-accent text-white'
                      : 'bg-surface-hover text-t-muted'
                  }`}
                >
                  {m.user.username}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Méthode de partage */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="text-sm text-t-muted block mb-2">Méthode de partage</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SPLIT_METHOD_LABELS) as SplitMethod[]).map((method) => (
                  <motion.button
                    key={method}
                    type="button"
                    onClick={() => setSplitMethod(method)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-3 rounded-lg text-left transition-colors border ${
                      splitMethod === method
                        ? 'border-accent bg-accent-secondary/10'
                        : 'border-[var(--border)] bg-surface hover:border-b-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{SPLIT_METHOD_ICONS[method]}</span>
                      <span className="text-xs font-semibold text-t-primary">{SPLIT_METHOD_LABELS[method]}</span>
                    </div>
                    <p className="text-[10px] text-t-faint mt-1">{SPLIT_METHOD_DESC[method]}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs custom selon la méthode */}
          {splitMethod !== 'equal' && selectedMembers.length > 0 && (
            <div className="bg-bg-secondary rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-t-muted">
                  {splitMethod === 'exact' && 'Montant par personne (€)'}
                  {splitMethod === 'percentage' && 'Pourcentage par personne (%)'}
                  {splitMethod === 'shares' && 'Nombre de parts par personne'}
                </p>
                {splitMethod === 'exact' && amount && (
                  <p className="text-xs text-t-faint">
                    Restant : {(parseFloat(amount) - Object.values(customValues).reduce((s, v) => s + (parseFloat(v) || 0), 0)).toFixed(2)}€
                  </p>
                )}
                {splitMethod === 'percentage' && (
                  <p className="text-xs text-t-faint">
                    Total : {Object.values(customValues).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(1)}%
                  </p>
                )}
              </div>
              {selectedMembers.map((userId) => (
                <div key={userId} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent shrink-0">
                    {getMemberName(userId)[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-t-primary min-w-[80px]">{getMemberName(userId)}</span>
                  <input
                    type="number"
                    step={splitMethod === 'shares' ? '1' : '0.01'}
                    min="0"
                    value={customValues[userId] || ''}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [userId]: e.target.value }))}
                    className="flex-1 border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={splitMethod === 'shares' ? '1' : '0'}
                  />
                  {splitMethod !== 'shares' && (
                    <span className="text-xs text-t-faint w-8">{splitMethod === 'percentage' ? '%' : '€'}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Aperçu du partage */}
          {selectedMembers.length > 0 && amount && (
            <div className="bg-bg-secondary rounded-lg p-3">
              <p className="text-xs font-medium text-t-muted mb-2">Aperçu</p>
              <div className="space-y-1">
                {selectedMembers.map((userId) => (
                  <div key={userId} className="flex items-center justify-between text-xs">
                    <span className="text-t-muted">{getMemberName(userId)}</span>
                    <span className="font-medium text-t-primary">
                      {(preview[userId] || 0).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={submitting || !isSplitValid() || !description}
              loading={submitting}
              fullWidth
              className="flex-1"
            >
              Ajouter
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowForm(false); setError('') }}
            >
              Annuler
            </Button>
          </div>
        </motion.form>
      )}
      </AnimatePresence>

      {/* Historique */}
      <div className="card card-glow p-5">
        <h3 className="font-semibold text-t-primary mb-3">Historique</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-t-faint text-center py-4">Aucune dépense pour le moment</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const isEqual = expense.splits.length > 1 &&
                expense.splits.every((s) => Math.abs(s.amount - expense.splits[0].amount) < 0.02)
              return (
                <div key={expense.id} className="flex items-start justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[expense.category] || '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-t-primary">{expense.description}</p>
                      <p className="text-xs text-t-faint">
                        Payé par {expense.paidBy.username} · {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {isEqual ? (
                        <p className="text-xs text-t-faint">
                          {expense.splits[0].amount.toFixed(2)}€/pers. entre {expense.splits.map((s) => s.user.username).join(', ')}
                        </p>
                      ) : (
                        <div className="text-xs text-t-faint mt-0.5">
                          {expense.splits.map((s) => (
                            <span key={s.userId} className="mr-2">
                              {s.user.username}: {s.amount.toFixed(2)}€
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-bold text-t-primary">{expense.amount.toFixed(2)}€</span>
                    {expense.paidById === currentUserId && (
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-xs text-danger hover:text-danger transition"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
