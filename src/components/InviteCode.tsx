'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function InviteCode({ code }: { code: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-accent-secondary hover:text-accent-secondary/80 transition cursor-pointer"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span className="font-medium">Inviter des colocataires</span>
      </button>

      {open && (
        <div className="mt-2 flex items-center gap-3 bg-[#161628]/85 backdrop-blur-lg border border-accent-secondary/20 rounded-lg px-4 py-2.5">
          <p className="font-pixel text-t-primary text-[10px]">{code}</p>
          <button
            onClick={copy}
            className="text-xs text-accent-secondary hover:text-accent-secondary/80 transition cursor-pointer"
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>
        </div>
      )}
    </div>
  )
}
