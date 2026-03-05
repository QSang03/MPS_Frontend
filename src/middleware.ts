import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { UserRole } from './constants/roles'
import { ROUTES } from './constants/routes'

// Cookie names (must stay in sync with session.ts)
const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const IS_SECURE_COOKIES =
  process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'

/**
 * Proactively refresh the access token inside the middleware response so that
 * by the time any Server Component renders it always has a valid access token.
 * This is the only safe place to write cookies outside of Server Actions /
 * Route Handlers in Next.js 15.
 */
async function proactiveTokenRefresh(request: NextRequest, response: NextResponse): Promise<void> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (accessToken) return // already have a token — nothing to do

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return // no refresh token — user must log in

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
    if (!backendUrl) return

    const resp = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!resp.ok) {
      // Refresh token invalid — clear stale cookies so the auth check below
      // correctly treats the user as unauthenticated.
      response.cookies.delete(REFRESH_TOKEN_COOKIE)
      response.cookies.delete(ACCESS_TOKEN_COOKIE)
      response.cookies.delete('mps_session')
      return
    }

    const data = await resp.json()
    const newAccessToken: string | undefined =
      data?.data?.accessToken || data?.accessToken || data?.access_token
    const newRefreshToken: string | undefined =
      data?.data?.refreshToken || data?.refreshToken || data?.refresh_token

    if (!newAccessToken) return

    response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      secure: IS_SECURE_COOKIES,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    if (newRefreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
        httpOnly: true,
        secure: IS_SECURE_COOKIES,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    }
  } catch {
    // Network error — let the request continue; Server Components will handle 401
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
)

interface Session {
  userId: string
  customerId: string
  role: UserRole // UserRole is now string type
  username: string
  email: string
  isDefaultPassword?: boolean
  isDefaultCustomer?: boolean
}

/**
 * Next.js Middleware for authentication and authorization
 * Runs on Edge Runtime for best performance
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing page - allow access without authentication
  if (pathname === '/') {
    const r = NextResponse.next()
    r.headers.set(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return r
  }

  // Allow public access to leads API (public consultation form)
  if (pathname.startsWith('/api/backend/leads')) {
    const r = NextResponse.next()
    r.headers.set(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return r
  }

  // Public routes - allow access without authentication
  // Include forgot-password so users can request a reset without being authenticated
  if (
    pathname === ROUTES.LOGIN ||
    pathname === '/change-password' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    // If already logged in, redirect to appropriate dashboard
    const session = await getSessionFromRequest(request)
    if (session) {
      // Only perform redirects for browser navigations (GET).
      // For non-GET requests (POST, PUT, PATCH) we should allow the
      // request to continue so Server Actions / API handlers can run.
      if (request.method !== 'GET') {
        const r = NextResponse.next()
        r.headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        )
        return r
      }
      // If user has default password, force to change-password page
      if (session.isDefaultPassword && pathname !== '/change-password') {
        const r = NextResponse.redirect(new URL('/change-password?required=true', request.url))
        r.headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        )
        return r
      }
      // If already changed password, redirect to dashboard
      if (!session.isDefaultPassword && pathname === '/change-password') {
        const r = NextResponse.redirect(new URL(getDashboardPath(session), request.url))
        r.headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        )
        return r
      }
      // If on change-password with default password, allow access
      if (pathname === '/change-password') {
        const r = NextResponse.next()
        r.headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        )
        return r
      }
      return NextResponse.redirect(new URL(getDashboardPath(session), request.url))
    }
    const r = NextResponse.next()
    r.headers.set(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return r
  }

  // Protected routes - require authentication
  const session = await getSessionFromRequest(request)

  if (!session) {
    // Not authenticated:
    // - For browser navigations (GET) redirect to login (clearing cookies)
    // - For non-GET (API/Server Actions), return a 401 JSON error so callers
    //   receive an appropriate status code instead of a 307 redirect.
    if (request.method === 'GET') {
      const response = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
      response.cookies.delete('mps_session')
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      response.headers.set(
        'cache-control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      )
      return response
    }

    const unauth = new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
    unauth.headers.set(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return unauth
  }

  // Check if user must change default password before accessing any protected route
  if (session.isDefaultPassword && pathname !== '/change-password') {
    // Browser navigations should be redirected to change-password.
    if (request.method === 'GET') {
      const r = NextResponse.redirect(new URL('/change-password?required=true', request.url))
      r.headers.set(
        'cache-control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      )
      return r
    }

    const pw = new NextResponse(JSON.stringify({ error: 'Password change required' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
    pw.headers.set(
      'cache-control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    return pw
  }

  // Access control based on isDefaultCustomer
  // isDefaultCustomer: true -> can access /system routes
  // isDefaultCustomer: false -> can access /user routes
  if (pathname.startsWith('/system')) {
    if (!session.isDefaultCustomer) {
      if (request.method === 'GET') {
        const r = NextResponse.redirect(new URL(ROUTES.FORBIDDEN, request.url))
        r.headers.set(
          'cache-control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        )
        return r
      }

      const f = new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
      f.headers.set(
        'cache-control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      )
      return f
    }
  }

  if (pathname.startsWith('/user')) {
    // All authenticated users can access /user routes
    // Additional checks can be added here if needed
  }

  // Add session info to headers for Server Components to access
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-customer-id', session.customerId)
  requestHeaders.set('x-user-role', session.role)

  const resp = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Proactively refresh the access token so it is available when Server
  // Components render.  Must be done on the response object so the updated
  // Set-Cookie headers are sent to the browser AND forwarded to the Node
  // server for the current render.
  await proactiveTokenRefresh(request, resp)

  resp.headers.set(
    'cache-control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  )
  return resp
}

/**
 * Helper function to get session from request cookies
 */
async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  try {
    const token = request.cookies.get('mps_session')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as Session
  } catch (error) {
    console.error('Session verification failed in middleware:', error)
    return null
  }
}

/**
 * Helper function to get dashboard path based on isDefaultCustomer
 */
function getDashboardPath(session: Session): string {
  if (session.isDefaultCustomer) {
    return ROUTES.CUSTOMER_ADMIN // or ROUTES.SYSTEM_ADMIN_CUSTOMERS if needed
  } else {
    return ROUTES.USER_MY_DEVICES
  }
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
