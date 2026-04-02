'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { pusherClient } from '@/lib/pusher-client'

type Message = {
  id: string
  content: string
  type: string
  imageUrl: string | null
  createdAt: string
  user: { id: string; username: string; avatar: string | null }
}

type ChatMember = {
  id: string
  username: string
}

type GiphyGif = {
  id: string
  title: string
  images: { fixed_height: { url: string } }
}

// Rend le contenu d'un message avec les @mentions en surbrillance
function MessageContent({
  content,
  isMe,
  members,
}: {
  content: string
  isMe: boolean
  members: ChatMember[]
}) {
  const memberNames = new Set(members.map((m) => m.username.toLowerCase()))
  // Split le contenu sur les @mentions
  const parts = content.split(/(@\w+)/g)

  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        const mentionMatch = part.match(/^@(\w+)$/)
        if (mentionMatch) {
          const name = mentionMatch[1].toLowerCase()
          const isMention = memberNames.has(name) || name === 'everyone'
          if (isMention) {
            return (
              <span
                key={i}
                className={`font-semibold rounded px-0.5 ${
                  isMe
                    ? 'bg-white/20 text-white'
                    : 'bg-accent/15 text-accent'
                }`}
              >
                {part}
              </span>
            )
          }
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export default function Chat({
  colocId,
  currentUserId,
  members,
  initialMessages,
}: {
  colocId: string
  currentUserId: string
  members: ChatMember[]
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [gifSearch, setGifSearch] = useState('')
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const shouldAutoScroll = useRef(true)

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(0)

  const mentionSuggestions = mentionQuery !== null
    ? [
        { id: '__everyone__', username: 'everyone' },
        ...members.filter((m) => m.id !== currentUserId),
      ].filter((m) =>
        m.username.toLowerCase().startsWith(mentionQuery.toLowerCase())
      )
    : []

  // S'abonner au channel Pusher
  useEffect(() => {
    const channel = pusherClient.subscribe(`coloc-${colocId}`)

    const handler = (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      if (shouldAutoScroll.current) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }

    channel.bind('new-message', handler)

    return () => {
      channel.unbind('new-message', handler)
    }
  }, [colocId])

  // Auto-scroll au chargement initial
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [])

  // Détecter si on est en bas du scroll
  function handleScroll() {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100
  }

  // Charger les anciens messages
  async function loadMore() {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = messages[0].createdAt
      const older = await api.get(`/api/coloc/${colocId}/chat?before=${oldest}`)
      if (older.length < 50) setHasMore(false)
      if (older.length > 0) {
        const prevHeight = listRef.current?.scrollHeight || 0
        setMessages((prev) => [...older, ...prev])
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight - prevHeight
          }
        })
      }
    } catch {
      // silently fail
    }
    setLoadingMore(false)
  }

  // Gérer l'input et la détection de @
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInput(value)

    const cursorPos = e.target.selectionStart ?? value.length
    // Chercher un @ non complété avant le curseur
    const textBeforeCursor = value.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)

    if (atMatch) {
      setMentionQuery(atMatch[1])
      setMentionStart(cursorPos - atMatch[0].length)
      setMentionIndex(0)
    } else {
      setMentionQuery(null)
    }
  }

  // Insérer la mention sélectionnée
  function insertMention(username: string) {
    const before = input.slice(0, mentionStart)
    const afterCursor = input.slice(mentionStart).replace(/@\w*/, '')
    const newInput = `${before}@${username} ${afterCursor}`
    setInput(newInput)
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  // Gestion du clavier dans l'autocomplete
  function handleKeyDown(e: React.KeyboardEvent) {
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((i) => Math.min(i + 1, mentionSuggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        insertMention(mentionSuggestions[mentionIndex].username)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }
  }

  // Envoyer un message texte
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    setMentionQuery(null)
    try {
      await api.post(`/api/coloc/${colocId}/chat`, { content: input.trim() })
      setInput('')
      shouldAutoScroll.current = true
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      // silently fail
    }
    setSending(false)
  }

  // Rechercher des GIFs
  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/trending?api_key=GlVGYHkr3WSBnllca54iNt0yFbjz7L65&limit=20&rating=g`
        )
        const data = await res.json()
        setGifs(data.data)
      } catch {
        setGifs([])
      }
      return
    }
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=GlVGYHkr3WSBnllca54iNt0yFbjz7L65&q=${encodeURIComponent(query)}&limit=20&rating=g`
      )
      const data = await res.json()
      setGifs(data.data)
    } catch {
      setGifs([])
    }
  }, [])

  // Debounce la recherche GIF
  useEffect(() => {
    if (!showGif) return
    const timer = setTimeout(() => searchGifs(gifSearch), 300)
    return () => clearTimeout(timer)
  }, [gifSearch, showGif, searchGifs])

  // Envoyer un GIF
  async function sendGif(gif: GiphyGif) {
    setShowGif(false)
    setGifSearch('')
    try {
      await api.post(`/api/coloc/${colocId}/chat`, {
        content: gif.title || 'GIF',
        type: 'gif',
        imageUrl: gif.images.fixed_height.url,
      })
      shouldAutoScroll.current = true
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      // silently fail
    }
  }

  function formatTime(date: string) {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Liste des messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {/* Bouton charger plus */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-accent hover:text-accent-hover transition"
            >
              {loadingMore ? 'Chargement...' : 'Charger les anciens messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-t-faint text-sm">
            Aucun message. Commence la conversation !
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user.id === currentUserId
          const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className="w-7 h-7 flex-shrink-0">
                {showAvatar ? (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    isMe ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-t-muted'
                  }`}>
                    {msg.user.username[0].toUpperCase()}
                  </div>
                ) : null}
              </div>

              {/* Bulle */}
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                  <p className="text-xs text-t-faint mb-0.5 ml-1">{msg.user.username}</p>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    isMe
                      ? 'bg-[#7c3aed]/95 backdrop-blur-md text-white rounded-br-sm'
                      : 'bg-[#2a2a4a]/95 backdrop-blur-md text-t-primary rounded-bl-sm'
                  }`}
                  style={!isMe ? { boxShadow: 'var(--shadow)' } : undefined}
                >
                  {msg.type === 'gif' && msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt={msg.content}
                      className="rounded-lg max-w-[250px]"
                    />
                  ) : (
                    <MessageContent
                      content={msg.content}
                      isMe={isMe}
                      members={members}
                    />
                  )}
                </div>
                <p className={`text-[10px] text-t-faint mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Picker GIF */}
      {showGif && (
        <div className="border-t border-[var(--border)] bg-[#161628]/95 backdrop-blur-md p-3 max-h-72 overflow-y-auto">
          <input
            type="text"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            placeholder="Rechercher un GIF..."
            className="w-full px-3 py-2 text-sm border border-b rounded-lg mb-2 text-t-primary bg-input-bg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="grid grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => sendGif(gif)}
                className="rounded-lg overflow-hidden hover:opacity-80 transition"
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-24 object-cover"
                />
              </button>
            ))}
          </div>
          {gifs.length === 0 && (
            <p className="text-center text-t-faint text-xs py-4">Aucun GIF trouvé</p>
          )}
        </div>
      )}

      {/* Input + mention autocomplete */}
      <div className="relative">
        {/* Popup autocomplete mentions */}
        <AnimatePresence>
          {mentionQuery !== null && mentionSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute bottom-full left-3 right-3 mb-1 bg-surface border border-b rounded-xl overflow-hidden z-50"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              {mentionSuggestions.map((member, i) => (
                <button
                  key={member.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertMention(member.username)
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                    i === mentionIndex
                      ? 'bg-accent/10 text-accent'
                      : 'text-t-primary hover:bg-surface-hover'
                  }`}
                >
                  {member.username === 'everyone' ? (
                    <>
                      <span className="w-6 h-6 rounded-full bg-accent-secondary/20 flex items-center justify-center text-xs">
                        @
                      </span>
                      <span className="font-medium">everyone</span>
                      <span className="text-xs text-t-faint ml-auto">Mentionner tout le monde</span>
                    </>
                  ) : (
                    <>
                      <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">
                        {member.username[0].toUpperCase()}
                      </span>
                      <span className="font-medium">{member.username}</span>
                    </>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={sendMessage} className="border-t border-[var(--border)] bg-[#161628]/95 backdrop-blur-md p-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGif(!showGif)}
            className={`p-2 rounded-lg transition text-lg ${showGif ? 'bg-accent/15 text-accent' : 'text-t-muted hover:bg-surface-hover'}`}
            title="Envoyer un GIF"
          >
            GIF
          </button>
          <button
            type="button"
            onClick={() => {
              setInput((prev) => prev + '@')
              inputRef.current?.focus()
              // Déclencher la détection de mention
              setTimeout(() => {
                if (inputRef.current) {
                  const cursorPos = inputRef.current.selectionStart ?? inputRef.current.value.length
                  const textBefore = inputRef.current.value.slice(0, cursorPos)
                  const atMatch = textBefore.match(/@(\w*)$/)
                  if (atMatch) {
                    setMentionQuery(atMatch[1])
                    setMentionStart(cursorPos - atMatch[0].length)
                    setMentionIndex(0)
                  }
                }
              }, 0)
            }}
            className="p-2 rounded-lg text-t-muted hover:bg-surface-hover hover:text-accent transition text-sm font-bold"
            title="Mentionner quelqu'un"
          >
            @
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ton message... (@pseudo pour mentionner)"
            className="flex-1 px-4 py-2 text-sm bg-input-bg text-t-primary rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 bg-accent text-white rounded-full hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
