import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { UserRole } from '@/constants/roles'

const SESSION_COOKIE_NAME = 'mps_session'
const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
)

/**
 * Session data structure
 */
export interface Session {
  userId: string
  customerId: string
  role: UserRole
  username: string
  email: string
  [key: string]: string | UserRole // Index signature for JWT compatibility
}

/**
 * Session with tokens
 */
export interface SessionWithTokens {
  session: Session
  accessToken: string
  refreshToken: string
}

/**
 * Create a new session and set httpOnly cookies
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function createSession(payload: Session): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
}

/**
 * Create session with tokens and set httpOnly cookies
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function createSessionWithTokens(payload: SessionWithTokens): Promise<void> {
  // Create session JWT
  const sessionToken = await new SignJWT(payload.session)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET)

  const cookieStore = await cookies()

  // Set session cookie
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  // Set access token cookie (15 minutes expiry)
  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, payload.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  })

  // Set refresh token cookie (longer expiry)
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, payload.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Get current session from httpOnly cookie
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as Session
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

/**
 * Get access token from cookie
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value || null
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value || null
  } catch (error) {
    console.error('Failed to get refresh token:', error)
    return null
  }
}

/**
 * Destroy current session and all tokens
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken()

    if (!refreshToken) {
      console.error('No refresh token available')
      return null
    }

    // Call refresh API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    })

    // Handle case where refresh endpoint doesn't exist (404)
    if (response.status === 404) {
      console.error('Refresh endpoint not found - API may not be implemented')
      // Clear all auth data and redirect to login
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      // Redirect to login
      const { redirect } = await import('next/navigation')
      redirect('/login')
      return null
    }

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status, response.statusText)
      // If refresh fails, clear all auth data and redirect to login
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      // Redirect to login
      const { redirect } = await import('next/navigation')
      redirect('/login')
      return null
    }

    const data = await response.json()

    // Handle empty response or missing data
    if (!data || Object.keys(data).length === 0) {
      console.error('Empty response from refresh endpoint:', data)
      // Clear all auth data and redirect to login
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      // Redirect to login
      const { redirect } = await import('next/navigation')
      redirect('/login')
      return null
    }

    const newAccessToken = data.accessToken || data.access_token || data.token

    if (!newAccessToken) {
      console.error('No access token in refresh response:', data)
      // Clear invalid refresh token and session
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      // Redirect to login
      const { redirect } = await import('next/navigation')
      redirect('/login')
      return null
    }

    // Update access token cookie
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    return newAccessToken
  } catch (error) {
    console.error('Error refreshing access token:', error)
    // Clear all auth data and redirect to login
    try {
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      // Redirect to login
      const { redirect } = await import('next/navigation')
      redirect('/login')
    } catch (cookieError) {
      console.error('Error clearing auth data:', cookieError)
      // Still redirect even if cookie clearing fails
      const { redirect } = await import('next/navigation')
      redirect('/login')
    }
    return null
  }
}

/**
 * Refresh session expiration time
 */
export async function refreshSession(): Promise<void> {
  const session = await getSession()
  if (session) {
    await createSession(session)
  }
}
