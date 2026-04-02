'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { RARITY_LABELS, RARITY_COLORS } from '@/lib/xp'
import { motion, AnimatePresence } from 'framer-motion'
import Button, { ToggleButton } from '@/components/ui/Button'

type ShopItem = {
  id: string
  name: string
  description: string | null
  price: number
  layer: string
  spriteName: string
  rarity: string
  isFree: boolean
  owned: boolean
}

type Props = {
  initialItems: ShopItem[]
  initialCurrency: number
}

const LAYER_TABS = [
  { id: 'all', label: 'Tout', icon: '🛒' },
  { id: 'hair', label: 'Cheveux', icon: '💇' },
  { id: 'eyes', label: 'Yeux', icon: '👀' },
  { id: 'top', label: 'Haut', icon: '👕' },
  { id: 'bottom', label: 'Bas', icon: '👖' },
  { id: 'shoes', label: 'Chaussures', icon: '👟' },
  { id: 'accessory', label: 'Accessoire', icon: '🧢' },
]

// Mapping layer -> prefix pour le nom de fichier sprite
function getSpriteUrl(layer: string, spriteName: string) {
  const prefix = layer === 'accessory' ? 'acc' : layer
  return `/sprites/${layer}/${prefix}-${spriteName}.png`
}

export default function Shop({ initialItems, initialCurrency }: Props) {
  const [items, setItems] = useState(initialItems)
  const [currency, setCurrency] = useState(initialCurrency)
  const [activeTab, setActiveTab] = useState('all')
  const [buying, setBuying] = useState<string | null>(null)
  const [justBought, setJustBought] = useState<string | null>(null)

  const filteredItems = activeTab === 'all'
    ? items.filter((i) => !i.isFree)
    : items.filter((i) => !i.isFree && i.layer === activeTab)

  async function handleBuy(itemId: string) {
    setBuying(itemId)
    try {
      const result = await api.post('/api/shop/buy', { itemId })
      setCurrency(result.currency)
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, owned: true } : i))
      )
      setJustBought(itemId)
      setTimeout(() => setJustBought(null), 2000)
      toast.success('Objet acheté !')
    } catch {
      toast.error('Achat impossible')
    }
    setBuying(null)
  }

  return (
    <main className="max-w-lg mx-auto p-6 space-y-5">
      {/* Solde */}
      <div className="card card-glow p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-t-muted">Mon solde</p>
          <p className="text-3xl font-bold text-accent-secondary stat-number">{currency} <span className="text-xl">🪙</span></p>
        </div>
        <p className="text-xs text-t-faint max-w-[160px] text-right">
          Gagne des coins en complétant des tâches moyennes et difficiles
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2">
        {LAYER_TABS.map((tab) => (
          <ToggleButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            pill={false}
            className="flex-shrink-0"
          >
            {tab.icon} {tab.label}
          </ToggleButton>
        ))}
      </div>

      {/* Grille items */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={!item.owned ? { y: -4, scale: 1.02 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`bg-surface border border-[var(--border)] rounded-lg backdrop-blur-sm p-4 flex flex-col items-center gap-3 ${
                item.owned ? 'opacity-60' : ''
              }`}
            >
              {/* Sprite preview */}
              <div className="w-20 h-20 bg-bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={getSpriteUrl(item.layer, item.spriteName)}
                  alt={item.name}
                  className="w-full h-full"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Nom */}
              <p className="text-sm font-medium text-t-primary text-center leading-tight">
                {item.name}
              </p>

              {/* Badge rareté */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RARITY_COLORS[item.rarity]}`}>
                {RARITY_LABELS[item.rarity]}
              </span>

              {/* Bouton achat ou état */}
              {item.owned ? (
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  {justBought === item.id ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lg"
                    >
                      🎉
                    </motion.span>
                  ) : (
                    '✓ Possédé'
                  )}
                </div>
              ) : (
                <Button
                  variant={currency < item.price ? 'ghost' : 'primary'}
                  size="sm"
                  fullWidth
                  onClick={() => handleBuy(item.id)}
                  disabled={buying === item.id || currency < item.price}
                  loading={buying === item.id}
                  className="font-bold"
                >
                  {`${item.price} 🪙`}
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-t-faint text-sm py-8">
          Aucun item dans cette catégorie
        </p>
      )}
    </main>
  )
}
