import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// backendApiClient is not used here; this route uses `getWithRefresh` helper
import { getWithRefresh } from '@/lib/api/server-proxy'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    // Allow Authorization header as a fallback for API clients/tests (Bearer token)
    if (!accessToken) {
      const authHeader =
        request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        accessToken = authHeader.slice(7).trim()
      }
    }

    console.debug('[api/policy-conditions] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const params: Record<string, string | number | boolean> = {}
    const page = url.searchParams.get('page')
    const limit = url.searchParams.get('limit')
    const search = url.searchParams.get('search')
    const isActive = url.searchParams.get('isActive')
    const dataType = url.searchParams.get('dataType')
    if (page) params.page = Number(page)
    if (limit) params.limit = Number(limit)
    if (search) params.search = search
    if (typeof isActive === 'string') params.isActive = isActive === 'true'
    if (dataType) params.dataType = dataType

    try {
      const data = await getWithRefresh(
        request,
        API_ENDPOINTS.POLICY_CONDITIONS,
        Object.keys(params).length ? params : undefined
      )
      try {
        console.debug(
          '[api/policy-conditions] backend returned',
          Array.isArray(data) ? data.length : (data?.data?.length ?? 'unknown')
        )
      } catch {}
      return NextResponse.json(data)
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number } | undefined
      return NextResponse.json(
        { error: e?.message || 'Internal Server Error' },
        { status: e?.status || 500 }
      )
    }
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined

    console.error('API Route /api/policy-conditions GET error:', error)
    if (err?.response)
      console.debug(
        '[api/policy-conditions] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
