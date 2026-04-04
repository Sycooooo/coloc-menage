import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAuthorizationUrl } from '@/lib/spotify'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL))
  }

  // Encode userId dans le state pour éviter les problèmes de cookies cross-origin
  const state = `${crypto.randomUUID()}|${session.user.id}`

  return NextResponse.redirect(getAuthorizationUrl(state))
}
