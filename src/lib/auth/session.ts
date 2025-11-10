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
  isDefaultPassword?: boolean
  [key: string]: string | UserRole | boolean | undefined // Index signature for JWT compatibility
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
 * Update tokens in cookies
 * This is a separate function to be called from Server Actions
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function updateTokensInCookies(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const cookieStore = await cookies()

  // Update access token cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  })

  // If new refresh token is provided, update it too
  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
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

// Global promise to prevent multiple concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null

/**
 * Refresh access token using refresh token
 * Uses axios directly to avoid circular dependency with serverApiClient
 * Prevents multiple concurrent refresh calls
 */
export async function refreshAccessToken(): Promise<string | null> {
  // If there's already a refresh in progress, wait for it
  if (refreshPromise) {
    return refreshPromise
  }

  // Create new refresh promise
  refreshPromise = doRefreshToken()

  // Clear promise when done (success or error)
  try {
    const result = await refreshPromise
    return result
  } finally {
    refreshPromise = null
  }
}

/**
 * Internal function to perform token refresh
 * Calls backend API directly and updates cookies
 */
async function doRefreshToken(): Promise<string | null> {
  try {
    // Get refresh token from cookies
    const refreshToken = await getRefreshToken()

    if (!refreshToken) {
      console.error('No refresh token available')
      return null
    }

    // Call backend refresh API directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    // Check response status
    if (!response.ok) {
      console.error('Token refresh failed:', response.status, response.statusText)

      // Clear cookies on failure
      const cookieStore = await cookies()
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      return null
    }

    // Parse JSON response
    const responseData = await response.json()

    // Extract tokens from response (handle different formats)
    let newAccessToken: string | undefined
    let newRefreshToken: string | undefined

    if ('data' in responseData && responseData.data) {
      newAccessToken = responseData.data.accessToken
      newRefreshToken = responseData.data.refreshToken
    } else {
      newAccessToken = responseData.accessToken || responseData.access_token
      newRefreshToken = responseData.refreshToken || responseData.refresh_token
    }

    if (!newAccessToken) {
      console.error('No access token in refresh response')
      return null
    }

    // Update cookies with new tokens
    await updateTokensInCookies(newAccessToken, newRefreshToken)

    // Return the new access token
    return newAccessToken
  } catch (error) {
    console.error('Error refreshing token:', error)
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
