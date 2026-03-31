'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

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

  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function fetchData() {
    try {
      const data = await api.get(`/api/coloc/${colocId}/expenses`)
      setExpenses(data.expenses)
      setBalances(data.balances)
      setMembers(data.members)
      // Par défaut, tout le monde participe
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !description) return
    setSubmitting(true)
    try {
      await api.post(`/api/coloc/${colocId}/expenses`, {
        amount: parseFloat(amount),
        description,
        category,
        splitBetween: selectedMembers,
      })
      setAmount('')
      setDescription('')
      setCategory('other')
      setShowForm(false)
      await fetchData()
      router.refresh()
    } catch (err) {
      console.error(err)
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

  function getMemberName(userId: string) {
    return members.find((m) => m.userId === userId)?.user.username || '?'
  }

  if (loading) {
    return <div className="text-center py-8 text-stone-400">Chargement...</div>
  }

  const settlements = getSettlements()
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 text-center">
          <p className="text-sm text-stone-500">Total dépenses</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{totalExpenses.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5 text-center">
          <p className="text-sm text-stone-500">Nombre</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{expenses.length}</p>
        </div>
      </div>

      {/* Soldes */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-800 mb-3">Soldes</h3>
        <div className="space-y-2">
          {members.map((m) => {
            const balance = balances[m.userId] || 0
            return (
              <div key={m.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800">
                    {m.user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-stone-700">{m.user.username}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    balance > 0.01
                      ? 'text-green-600'
                      : balance < -0.01
                        ? 'text-red-500'
                        : 'text-stone-400'
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

      {/* Remboursements */}
      {settlements.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-900 mb-3">Qui rembourse qui ?</h3>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-amber-800">{getMemberName(s.from)}</span>
                <span className="text-amber-600">doit</span>
                <span className="font-bold text-amber-900">{s.amount.toFixed(2)}€</span>
                <span className="text-amber-600">à</span>
                <span className="font-medium text-amber-800">{getMemberName(s.to)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton ajouter */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition"
        >
          + Ajouter une dépense
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h3 className="font-semibold text-stone-800">Nouvelle dépense</h3>

          <div>
            <label className="text-sm text-stone-600 block mb-1">Montant (€)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="12.50"
              required
            />
          </div>

          <div>
            <label className="text-sm text-stone-600 block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Courses Carrefour"
              required
            />
          </div>

          <div>
            <label className="text-sm text-stone-600 block mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {CATEGORY_ICONS[key]} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-stone-600 block mb-1">Partagé entre</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    selectedMembers.includes(m.userId)
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {m.user.username}
                </button>
              ))}
            </div>
            {selectedMembers.length > 0 && amount && (
              <p className="text-xs text-stone-400 mt-2">
                = {(parseFloat(amount) / selectedMembers.length).toFixed(2)}€ par personne
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || selectedMembers.length === 0}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50"
            >
              {submitting ? 'Ajout...' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-stone-500 hover:bg-stone-100 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-800 mb-3">Historique</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">Aucune dépense pour le moment</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-start justify-between border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[expense.category] || '📦'}</span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{expense.description}</p>
                    <p className="text-xs text-stone-400">
                      Payé par {expense.paidBy.username} · {new Date(expense.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-stone-400">
                      Partagé entre {expense.splits.map((s) => s.user.username).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-800">{expense.amount.toFixed(2)}€</span>
                  {expense.paidById === currentUserId && (
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
