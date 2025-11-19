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
  role: UserRole
  username: string
  email: string
  isDefaultPassword?: boolean
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
      // If user has default password, force to change-password page
      if (session.isDefaultPassword && pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password?required=true', request.url))
      }
      // If already changed password, redirect to dashboard
      if (!session.isDefaultPassword && pathname === '/change-password') {
        return NextResponse.redirect(new URL(getDashboardPath(session.role), request.url))
      }
      // If on change-password with default password, allow access
      if (pathname === '/change-password') {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL(getDashboardPath(session.role), request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require authentication
  const session = await getSessionFromRequest(request)

  if (!session) {
    // Not authenticated - redirect to login and clear any invalid cookies
    const response = NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
    response.cookies.delete('mps_session')
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  }

  // Check if user must change default password before accessing any protected route
  if (session.isDefaultPassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password?required=true', request.url))
  }

  // Role-based access control (RBAC)
  if (pathname.startsWith('/system-admin') && session.role !== UserRole.SYSTEM_ADMIN) {
    return NextResponse.redirect(new URL(ROUTES.FORBIDDEN, request.url))
  }

  if (pathname.startsWith('/system')) {
    if (session.role !== UserRole.CUSTOMER_ADMIN && session.role !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.redirect(new URL(ROUTES.FORBIDDEN, request.url))
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
 * Helper function to get dashboard path based on role
 */
function getDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return ROUTES.SYSTEM_ADMIN_CUSTOMERS
    case UserRole.CUSTOMER_ADMIN:
      return ROUTES.CUSTOMER_ADMIN
    case UserRole.USER:
      return ROUTES.USER_MY_DEVICES
    default:
      return ROUTES.LOGIN
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
