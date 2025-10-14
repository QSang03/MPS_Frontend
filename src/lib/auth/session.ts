import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { UserRole } from '@/constants/roles'

const SESSION_COOKIE_NAME = 'mps_session'
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
 * Create a new session and set httpOnly cookie
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
 * Destroy current session
 * ⚠️ Next.js 15: cookies() is now async
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
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
