'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import Button, { ToggleButton } from '@/components/ui/Button'

type Etape = {
  description: string
  duree: number | null // minutes, null si pas de minuteur
}

type Plat = {
  nom: string
  ingredients: string[]
  etapes?: Etape[]
}

type Meal = {
  dejeuner: Plat
  diner: Plat
}

type ShoppingItem = {
  nom: string
  quantite: string
  categorie: string
  prixEstime: number
}

type WeeklyMenuData = {
  id: string
  meals: Record<string, Meal>
  shoppingList: ShoppingItem[] | null
  nbPersons: number
  restrictions: string | null
  budget: string
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAY_EMOJIS: Record<string, string> = {
  Lundi: '1️⃣', Mardi: '2️⃣', Mercredi: '3️⃣', Jeudi: '4️⃣',
  Vendredi: '5️⃣', Samedi: '6️⃣', Dimanche: '7️⃣',
}

const CATEGORIES_ORDER = [
  'Fruits & Légumes', 'Viandes & Poissons', 'Produits laitiers',
  'Épicerie', 'Boulangerie', 'Surgelés', 'Boissons', 'Autre',
]

export default function Menu({
  colocId,
  initialMenu,
}: {
  colocId: string
  initialMenu: WeeklyMenuData | null
}) {
  const [menu, setMenu] = useState<WeeklyMenuData | null>(initialMenu)
  const [generating, setGenerating] = useState(false)
  const [showShopping, setShowShopping] = useState(false)
  const [nbPersons, setNbPersons] = useState(menu?.nbPersons || 2)
  const [restrictions, setRestrictions] = useState(menu?.restrictions || '')
  const [budget, setBudget] = useState(menu?.budget || 'moyen')
  const [goal, setGoal] = useState('')
  const [preferences, setPreferences] = useState('')
  const [calories, setCalories] = useState('')
  const [showForm, setShowForm] = useState(!initialMenu)

  async function generate() {
    setGenerating(true)
    try {
      const data = await api.post(`/api/coloc/${colocId}/menu`, {
        nbPersons,
        restrictions: restrictions.trim() || null,
        budget,
        goal: goal.trim() || null,
        preferences: preferences.trim() || null,
        calories: calories ? Number(calories) : null,
      })
      setMenu(data)
      setShowForm(false)
    } catch {
      alert('Erreur lors de la génération. Réessaie.')
    }
    setGenerating(false)
  }

  const totalPrice = menu?.shoppingList?.reduce((sum, item) => sum + item.prixEstime, 0) || 0

  // Grouper la liste de courses par catégorie
  const shoppingByCategory: Record<string, ShoppingItem[]> = {}
  if (menu?.shoppingList) {
    for (const item of menu.shoppingList) {
      if (!shoppingByCategory[item.categorie]) {
        shoppingByCategory[item.categorie] = []
      }
      shoppingByCategory[item.categorie].push(item)
    }
  }

  function downloadShoppingList() {
    if (!menu?.shoppingList) return

    const lines: string[] = []
    lines.push('LISTE DE COURSES')
    lines.push(`${menu.nbPersons} personne${menu.nbPersons > 1 ? 's' : ''} | Budget ${menu.budget}`)
    lines.push('')

    for (const cat of CATEGORIES_ORDER) {
      const items = shoppingByCategory[cat]
      if (!items) continue
      lines.push(`── ${cat.toUpperCase()} ──`)
      for (const item of items) {
        lines.push(`☐  ${item.nom} — ${item.quantite} (${item.prixEstime.toFixed(2)}€)`)
      }
      lines.push('')
    }

    lines.push(`TOTAL ESTIMÉ : ~${totalPrice.toFixed(2)}€`)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'liste-de-courses.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Formulaire de génération */}
      {showForm && (
        <div className="card card-glow p-5 space-y-4">
          <h2 className="font-semibold text-t-primary">Paramètres du menu</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-t-muted mb-1">Nombre de personnes</label>
              <select
                value={nbPersons}
                onChange={(e) => setNbPersons(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-t-muted mb-1">Budget</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="economique">Economique</option>
                <option value="moyen">Moyen</option>
                <option value="genereux">Généreux</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-t-muted mb-1">Restrictions alimentaires</label>
              <input
                type="text"
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                placeholder="végétarien, sans gluten, halal..."
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-t-muted mb-1">Objectif sportif</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Aucun</option>
                <option value="prise_masse">Prise de masse</option>
                <option value="seche">Sèche / Perte de poids</option>
                <option value="maintien">Maintien</option>
                <option value="performance">Performance sportive</option>
                <option value="endurance">Endurance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-t-muted mb-1">Calories / jour (optionnel)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="ex: 2200"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-t-muted mb-1">Préférences culinaires</label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="cuisine asiatique, italien, rapide..."
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={generating}
            loading={generating}
            fullWidth
          >
            {generating ? 'Génération en cours... (10-20s)' : 'Générer le menu de la semaine'}
          </Button>
        </div>
      )}

      {/* Menu de la semaine */}
      {menu && !showForm && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-t-primary">Menu de la semaine</h2>
              <p className="text-xs text-t-faint mt-0.5">
                {menu.nbPersons} pers. | Budget {menu.budget}{menu.restrictions ? ` | ${menu.restrictions}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <ToggleButton
                active={showShopping}
                onClick={() => setShowShopping(!showShopping)}
              >
                🛒 Courses {totalPrice > 0 && `(~${totalPrice.toFixed(0)}€)`}
              </ToggleButton>
              <Button
                variant="ghost"
                size="sm"
                pill
                onClick={() => setShowForm(true)}
              >
                Regénérer
              </Button>
            </div>
          </div>

          {/* Vue liste de courses */}
          {showShopping && menu.shoppingList && (
            <div className="card card-glow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-t-primary">Liste de courses</h3>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">~{totalPrice.toFixed(2)}€</p>
                  <button
                    onClick={downloadShoppingList}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition cursor-pointer"
                  >
                    Télécharger
                  </button>
                </div>
              </div>

              {CATEGORIES_ORDER.filter((cat) => shoppingByCategory[cat]).map((cat) => (
                <div key={cat}>
                  <h4 className="text-xs font-semibold text-t-muted uppercase tracking-wide mb-2">{cat}</h4>
                  <div className="space-y-1">
                    {shoppingByCategory[cat].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-surface-hover rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-t-primary">{item.nom}</span>
                          <span className="text-xs text-t-faint">{item.quantite}</span>
                        </div>
                        <span className="text-xs font-medium text-t-muted">{item.prixEstime.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vue menu par jour */}
          {!showShopping && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DAYS.map((day) => {
                const meal = menu.meals[day]
                if (!meal) return null
                return (
                  <div key={day} className="card card-glow backdrop-blur-sm p-4">
                    <p className="font-semibold text-t-primary mb-3">
                      {DAY_EMOJIS[day]} {day}
                    </p>

                    <div className="space-y-3">
                      <PlatCard label="Déjeuner" plat={meal.dejeuner} />
                      <div className="border-t border-[var(--border)] pt-3">
                        <PlatCard label="Dîner" plat={meal.diner} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// === Composant Plat avec dropdown étapes + minuteurs ===

function PlatCard({ label, plat }: { label: string; plat: Plat }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <p className="text-xs text-t-faint uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-t-primary">{plat.nom}</p>
      <p className="text-xs text-t-muted mt-0.5">{plat.ingredients.join(', ')}</p>

      {plat.etapes && plat.etapes.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition"
          >
            <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
            {open ? 'Masquer la préparation' : `Préparation (${plat.etapes.length} étapes)`}
          </button>

          {open && (
            <div className="mt-2 space-y-1.5">
              {plat.etapes.map((etape, i) => (
                <EtapeRow key={i} index={i + 1} etape={etape} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// === Composant Etape avec minuteur ===

function EtapeRow({ index, etape }: { index: number; etape: Etape }) {
  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(etape.duree ? etape.duree * 60 : 0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setTimerRunning(false)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startTimer() {
    if (!etape.duree) return
    setSecondsLeft(etape.duree * 60)
    setTimerRunning(true)
    setDone(false)

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer()
          setDone(true)
          // Notification sonore
          try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczHjqIuc/LdUMvPX2xysp3QS09f7PIwXRALj6CssS5cD0tQISzwbVtOy1Bh7S+sGo6LkOKtbqsZzgrRIy2uKlkNypEjre2pGE1KUWQuLOdXTQoRpK7sZlaNChHk7uwnFk0KEiVvK+YVjImSZa9rZVTMSVLmL6rlFAvJE2awKiQTC0iTprCoYtIKiBQnMKfjUcnHlKew5yIRCQcVKDEmoVBIRpWosWYgj4fGFikx5V+Oh0VW6bIknk3GhNdqMmPdjQYEF+qyox0MRYOYazLiXEvFA1jrsyGbi0SDmWwzYNrKhAMZ7LOgGgnDgpps8+AZyQMCWu1z4FnJAoGbbfQgGgjCAVwudGCaSIFBHK60oRqIgMDdL3ThWshAQF2v9SGbCAAAXfB1YdvIAABecPWiHAg').play() } catch {}
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-start gap-2 px-2.5 py-2 rounded-lg text-xs ${done ? 'bg-green-500/10' : 'bg-surface-hover'}`}>
      <span className="text-t-faint font-mono w-4 flex-shrink-0">{index}.</span>
      <p className="flex-1 text-t-muted">{etape.description}</p>

      {etape.duree && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!timerRunning && !done && (
            <button
              onClick={startTimer}
              className="flex items-center gap-1 px-2 py-0.5 bg-accent-secondary/15 text-accent-secondary rounded-full hover:bg-accent-secondary/25 transition"
            >
              <span>⏱</span> {etape.duree}min
            </button>
          )}
          {timerRunning && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-medium text-accent-secondary">{formatTimer(secondsLeft)}</span>
              <button
                onClick={stopTimer}
                className="px-1.5 py-0.5 bg-red-500/15 text-danger rounded-full hover:bg-red-500/25 transition"
              >
                Stop
              </button>
            </div>
          )}
          {done && (
            <span className="text-green-600 dark:text-green-400 font-medium">Terminé !</span>
          )}
        </div>
      )}
    </div>
  )
}
