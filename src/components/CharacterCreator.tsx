'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import PixelAvatar, { type AvatarConfigData } from './PixelAvatar'
import { RARITY_LABELS, RARITY_COLORS } from '@/lib/xp'

type AvailableItem = {
  id: string
  name: string
  layer: string
  spriteName: string
  rarity: string
  isFree: boolean
}

type Props = {
  initialConfig: AvatarConfigData | null
  availableItems: AvailableItem[]
}

const SKIN_TONES = [
  { id: 'light', label: 'Clair', color: '#ffe0bd' },
  { id: 'medium', label: 'Moyen', color: '#eac099' },
  { id: 'tan', label: 'Mat', color: '#c6986f' },
  { id: 'dark', label: 'Foncé', color: '#8d6342' },
  { id: 'deep', label: 'Ébène', color: '#593823' },
]

const LAYERS = [
  { id: 'skinTone', label: 'Peau', icon: '🎨' },
  { id: 'hair', label: 'Cheveux', icon: '💇' },
  { id: 'eyes', label: 'Yeux', icon: '👀' },
  { id: 'top', label: 'Haut', icon: '👕' },
  { id: 'bottom', label: 'Bas', icon: '👖' },
  { id: 'shoes', label: 'Chaussures', icon: '👟' },
  { id: 'accessory', label: 'Accessoire', icon: '🧢' },
]

const DEFAULT_CONFIG: AvatarConfigData = {
  skinTone: 'medium',
  body: 'default',
  hair: null,
  eyes: 'default',
  top: null,
  bottom: null,
  shoes: null,
  accessory: null,
}

export default function CharacterCreator({ initialConfig, availableItems }: Props) {
  const router = useRouter()
  const [config, setConfig] = useState<AvatarConfigData>(initialConfig || DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('skinTone')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateConfig(key: keyof AvatarConfigData, value: string | null) {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put('/api/profile/avatar-config', config)
      setSaved(true)
      router.refresh()
    } catch {
      // Silencieux pour l'instant
    }
    setSaving(false)
  }

  // Items filtrés par couche active
  const layerItems = availableItems.filter((i) => i.layer === activeTab)
  // Valeur actuelle sélectionnée pour l'onglet actif
  const currentValue = activeTab === 'skinTone'
    ? config.skinTone
    : config[activeTab as keyof AvatarConfigData]

  return (
    <main className="max-w-lg mx-auto p-6 space-y-5">
      {/* Preview du personnage */}
      <div className="bg-surface rounded-2xl border border-b p-6 flex flex-col items-center gap-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="bg-bg-secondary rounded-xl p-4">
          <PixelAvatar
            config={config}
            username="Preview"
            size="xl"
          />
        </div>
        <p className="text-sm text-t-muted">Apercu en temps réel</p>
      </div>

      {/* Onglets de couches */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-2 px-2">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveTab(layer.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === layer.id
                ? 'bg-accent text-white'
                : 'bg-surface text-t-muted hover:bg-surface-hover'
            }`}
          >
            {layer.icon} {layer.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      <div className="bg-surface rounded-2xl border border-b p-5" style={{ boxShadow: 'var(--shadow)' }}>
        {activeTab === 'skinTone' ? (
          /* Sélecteur de ton de peau */
          <div>
            <h3 className="font-semibold text-t-primary mb-4">Ton de peau</h3>
            <div className="flex gap-3 justify-center">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => updateConfig('skinTone', tone.id)}
                  className={`w-12 h-12 rounded-full border-3 transition ${
                    config.skinTone === tone.id
                      ? 'border-accent scale-110 shadow-lg'
                      : 'border-b hover:scale-105'
                  }`}
                  style={{ backgroundColor: tone.color }}
                  title={tone.label}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grille d'items pour la couche */
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-t-primary">
                {LAYERS.find((l) => l.id === activeTab)?.label}
              </h3>
              {/* Bouton pour retirer l'item (sauf yeux) */}
              {activeTab !== 'eyes' && (
                <button
                  onClick={() => updateConfig(activeTab as keyof AvatarConfigData, null)}
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    currentValue === null
                      ? 'bg-accent text-white'
                      : 'bg-surface-hover text-t-muted hover:text-t-primary'
                  }`}
                >
                  Aucun
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Items disponibles */}
              {layerItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateConfig(activeTab as keyof AvatarConfigData, item.spriteName)}
                  className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition ${
                    currentValue === item.spriteName
                      ? 'border-accent bg-accent/10 scale-[1.02]'
                      : 'border-b hover:border-b-hover hover:bg-surface-hover'
                  }`}
                >
                  <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={`/sprites/${item.layer}/${item.layer === 'accessory' ? 'acc' : item.layer}-${item.spriteName}.png`}
                      alt={item.name}
                      className="w-full h-full"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <span className="text-xs text-t-primary font-medium text-center leading-tight">
                    {item.name}
                  </span>
                  {item.isFree && (
                    <span className="text-[10px] text-success font-medium">Gratuit</span>
                  )}
                  {!item.isFree && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${RARITY_COLORS[item.rarity]}`}>
                      {RARITY_LABELS[item.rarity]}
                    </span>
                  )}
                </button>
              ))}

            </div>

            {layerItems.length === 0 && (
              <p className="text-center text-t-faint text-sm py-6">
                Aucun item disponible pour cette couche
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl font-bold text-white transition ${
          saved
            ? 'bg-success'
            : 'bg-accent hover:bg-accent-hover'
        } disabled:opacity-50`}
      >
        {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder mon personnage'}
      </button>
    </main>
  )
}
