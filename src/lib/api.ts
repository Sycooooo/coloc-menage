// === Client API centralisé ===
// Au lieu de réécrire fetch() partout, on utilise ces fonctions.
// Ca évite la répétition et les erreurs (oublier un header, etc.)

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function handleResponse(res: Response) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new ApiError(res.status, 'Réponse invalide du serveur')
  }
  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Une erreur est survenue')
  }
  return data
}

export const api = {
  // Pour envoyer des données JSON (créer une tâche, s'inscrire, etc.)
  async post(url: string, body?: Record<string, unknown>) {
    const options: RequestInit = { method: 'POST' }
    if (body) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    const res = await fetch(url, options)
    return handleResponse(res)
  },

  // Pour remplacer entièrement une ressource (sauvegarder une config, etc.)
  async put(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  // Pour modifier partiellement une ressource (changer un paramètre, etc.)
  async patch(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  // Pour récupérer des données (lister les tâches, etc.)
  async get(url: string) {
    const res = await fetch(url)
    return handleResponse(res)
  },

  // Pour supprimer une ressource
  async delete(url: string, body?: Record<string, unknown>) {
    const options: RequestInit = { method: 'DELETE' }
    if (body) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    const res = await fetch(url, options)
    return handleResponse(res)
  },

  // Pour envoyer des fichiers (upload d'avatar, etc.)
  async upload(url: string, formData: FormData) {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(res)
  },
}
