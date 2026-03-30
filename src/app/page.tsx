import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🏠</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Coloc Ménage
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Gérez les tâches de ménage avec vos colocataires, sans prise de tête.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-300 rounded-xl font-medium hover:bg-indigo-50 transition"
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </main>
  )
}
