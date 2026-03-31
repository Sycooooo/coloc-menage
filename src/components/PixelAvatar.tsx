'use client'

import Image from 'next/image'

export type AvatarConfigData = {
  skinTone: string
  body: string
  hair: string | null
  eyes: string
  top: string | null
  bottom: string | null
  shoes: string | null
  accessory: string | null
}

type PixelAvatarProps = {
  config: AvatarConfigData | null
  fallbackPhoto?: string | null
  username: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  sm: 32,
  md: 48,
  lg: 96,
  xl: 192,
}

export default function PixelAvatar({
  config,
  fallbackPhoto,
  username,
  size,
  className = '',
}: PixelAvatarProps) {
  const px = SIZES[size]

  // Cas 1 : Avatar pixel art configuré
  if (config) {
    // Les couches dans l'ordre d'empilement (du fond vers l'avant)
    const layers: string[] = [
      `/sprites/body/body-${config.skinTone}.png`,
    ]
    if (config.bottom) layers.push(`/sprites/bottom/bottom-${config.bottom}.png`)
    if (config.shoes) layers.push(`/sprites/shoes/shoes-${config.shoes}.png`)
    if (config.top) layers.push(`/sprites/top/top-${config.top}.png`)
    layers.push(`/sprites/eyes/eyes-${config.eyes}.png`)
    if (config.hair) layers.push(`/sprites/hair/hair-${config.hair}.png`)
    if (config.accessory) layers.push(`/sprites/accessory/acc-${config.accessory}.png`)

    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-surface ${className}`}
        style={{ width: px, height: px }}
      >
        {layers.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        ))}
      </div>
    )
  }

  // Cas 2 : Ancienne photo avatar
  if (fallbackPhoto) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{ width: px, height: px }}
      >
        <Image
          src={fallbackPhoto}
          alt={username}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  // Cas 3 : Initiale du username
  const fontSize = px < 48 ? 'text-sm' : px < 96 ? 'text-xl' : 'text-3xl'
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-accent/20 ${className}`}
      style={{ width: px, height: px }}
    >
      <span className={`font-bold text-accent ${fontSize}`}>
        {username[0]?.toUpperCase() || '?'}
      </span>
    </div>
  )
}
