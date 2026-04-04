import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeCode, getSpotifyProfile } from '@/lib/spotify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${baseUrl}/profile/settings?spotify=error`)
  }

  // Extraire le userId du state (format: uuid|userId)
  const userId = state?.split('|')[1]

  if (!code || !state || !userId) {
    return NextResponse.redirect(`${baseUrl}/profile/settings?spotify=error`)
  }

  try {
    const tokens = await exchangeCode(code)
    const profile = await getSpotifyProfile(tokens.access_token)

    await prisma.spotifyAccount.upsert({
      where: { userId },
      create: {
        userId,
        spotifyUserId: profile.id,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
      update: {
        spotifyUserId: profile.id,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    })

    return NextResponse.redirect(`${baseUrl}/profile/settings?spotify=linked`)
  } catch (err) {
    console.error('Erreur callback Spotify:', err)
    return NextResponse.redirect(`${baseUrl}/profile/settings?spotify=error`)
  }
}
