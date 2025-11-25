import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { UserRole } from './constants/roles'
import { ROUTES } from './constants/routes'

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
      if (request.method !== 'GET') return NextResponse.next()
      // If user has default password, force to change-password page
      if (session.isDefaultPassword && pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password?required=true', request.url))
      }
      // If already changed password, redirect to dashboard
      if (!session.isDefaultPassword && pathname === '/change-password') {
        return NextResponse.redirect(new URL(getDashboardPath(session), request.url))
      }
      // If on change-password with default password, allow access
      if (pathname === '/change-password') {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL(getDashboardPath(session), request.url))
    }
    return NextResponse.next()
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
      return response
    }

    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Check if user must change default password before accessing any protected route
  if (session.isDefaultPassword && pathname !== '/change-password') {
    // Browser navigations should be redirected to change-password.
    if (request.method === 'GET') {
      return NextResponse.redirect(new URL('/change-password?required=true', request.url))
    }

    // For non-GET (API/server actions) return 403 so calling code receives a
    // clear forbidden status rather than being redirected.
    return new NextResponse(JSON.stringify({ error: 'Password change required' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  // Access control based on isDefaultCustomer
  // isDefaultCustomer: true -> can access /system routes
  // isDefaultCustomer: false -> can access /user routes
  if (pathname.startsWith('/system')) {
    if (!session.isDefaultCustomer) {
      if (request.method === 'GET') {
        return NextResponse.redirect(new URL(ROUTES.FORBIDDEN, request.url))
      }

      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
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

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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
