import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth/session'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const simulate = searchParams.get('simulate')

  // Get access token
  const token = await getAccessToken()

  if (!token) {
    return NextResponse.json({ error: 'No access token found' }, { status: 401 })
  }

  // Simulate expired token scenario
  if (simulate === 'expired') {
    return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
  }

  // Normal successful response
  return NextResponse.json({
    success: true,
    message: 'Authenticated successfully',
    tokenLength: token.length,
    timestamp: new Date().toISOString(),
  })
}
