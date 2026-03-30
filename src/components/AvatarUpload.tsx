'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function AvatarUpload({
  currentAvatar,
  username,
}: {
  currentAvatar: string | null
  username: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentAvatar)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Aperçu immédiat
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.append('avatar', file)

    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center hover:opacity-80 transition group"
        title="Changer la photo"
      >
        {preview ? (
          <Image
            src={preview}
            alt={username}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-indigo-600">
            {username[0].toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <span className="text-white text-xs font-medium">
            {loading ? '...' : '📷 Changer'}
          </span>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
