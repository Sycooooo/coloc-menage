'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

type GiphyGif = {
  id: string
  title: string
  images: { fixed_height: { url: string } }
}

export default function Chat({
  colocId,
  currentUserId,
  initialMessages,
}: {
  colocId: string
  currentUserId: string
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
  const shouldAutoScroll = useRef(true)

  // S'abonner au channel Pusher
  useEffect(() => {
    const channel = pusherClient.subscribe(`coloc-${colocId}`)

    channel.bind('new-message', (message: Message) => {
      setMessages((prev) => {
        // Eviter les doublons (si c'est notre propre message déjà ajouté)
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      // Auto-scroll si on est en bas
      if (shouldAutoScroll.current) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`coloc-${colocId}`)
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
        // Maintenir la position de scroll
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

  // Envoyer un message texte
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
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
      // Trending GIFs
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
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
              className="text-xs text-indigo-500 hover:text-indigo-700 transition"
            >
              {loadingMore ? 'Chargement...' : 'Charger les anciens messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
                    isMe ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {msg.user.username[0].toUpperCase()}
                  </div>
                ) : null}
              </div>

              {/* Bulle */}
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && (
                  <p className="text-xs text-gray-400 mb-0.5 ml-1">{msg.user.username}</p>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    isMe
                      ? 'bg-indigo-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {msg.type === 'gif' && msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt={msg.content}
                      className="rounded-lg max-w-[250px]"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>
                <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
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
        <div className="border-t border-gray-200 bg-white p-3 max-h-72 overflow-y-auto">
          <input
            type="text"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
            placeholder="Rechercher un GIF..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
            <p className="text-center text-gray-400 text-xs py-4">Aucun GIF trouvé</p>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGif(!showGif)}
          className={`p-2 rounded-lg transition text-lg ${showGif ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
          title="Envoyer un GIF"
        >
          GIF
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ton message..."
          className="flex-1 px-4 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
