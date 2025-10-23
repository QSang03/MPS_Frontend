import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
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

    const response = await backendApiClient.get(API_ENDPOINTS.POLICY_CONDITIONS, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: Object.keys(params).length ? params : undefined,
    })

    console.debug(
      '[api/policy-conditions] backend returned',
      Array.isArray(response.data)
        ? response.data.length
        : (response.data?.data?.length ?? 'unknown')
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: any } }
      | undefined

    console.error('API Route /api/policy-conditions GET error:', error)
    if (err?.response)
      console.debug('[api/policy-conditions] backend response data:', err.response.data)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
