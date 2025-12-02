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

    console.debug('[api/resource-types] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const params: Record<string, string | number | boolean> = {}
    const page = url.searchParams.get('page')
    const limit = url.searchParams.get('limit')
    const search = url.searchParams.get('search')
    const isActive = url.searchParams.get('isActive')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder = url.searchParams.get('sortOrder')
    if (page) params.page = Number(page)
    if (limit) params.limit = Number(limit)
    if (search) params.search = search
    if (typeof isActive === 'string') params.isActive = isActive === 'true'
    if (sortBy) params.sortBy = sortBy
    if (sortOrder) params.sortOrder = sortOrder

    // Try the backend call and handle 401 (token) specifically so we can refresh and retry
    try {
      const response = await backendApiClient.get(API_ENDPOINTS.RESOURCE_TYPES, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: Object.keys(params).length ? params : undefined,
      })

      console.debug(
        '[api/resource-types] backend returned',
        Array.isArray(response.data)
          ? response.data.length
          : (response.data?.data?.length ?? 'unknown')
      )

      return NextResponse.json(response.data)
    } catch (innerErr: unknown) {
      const ierr = innerErr as
        | { response?: { status?: number; data?: unknown }; message?: string }
        | undefined
      // If backend returned 401, attempt token refresh and retry once
      if (ierr?.response?.status === 401) {
        console.debug('[api/resource-types] backend responded 401 — attempting token refresh')
        try {
          const cookieStore = await cookies()
          const refreshToken = cookieStore.get('refresh_token')?.value
          if (!refreshToken) {
            // No refresh token — clear cookies and return Unauthorized
            cookieStore.delete('access_token')
            cookieStore.delete('refresh_token')
            cookieStore.delete('mps_session')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

          const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })

          if (refreshResp.status !== 200) {
            cookieStore.delete('access_token')
            cookieStore.delete('refresh_token')
            cookieStore.delete('mps_session')
            return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
          }

          const payload = await refreshResp.json()
          const newAccessToken =
            payload?.data?.accessToken || payload?.accessToken || payload?.access_token
          const newRefreshToken =
            payload?.data?.refreshToken || payload?.refreshToken || payload?.refresh_token

          if (!newAccessToken) {
            cookieStore.delete('access_token')
            cookieStore.delete('refresh_token')
            cookieStore.delete('mps_session')
            return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
          }

          const isProduction = process.env.NODE_ENV === 'production'
          cookieStore.set('access_token', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 15,
            path: '/',
          })
          if (newRefreshToken)
            cookieStore.set('refresh_token', newRefreshToken, {
              httpOnly: true,
              secure: isProduction,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            })

          // Retry the backend call with the new access token
          const retryResp = await backendApiClient.get(API_ENDPOINTS.RESOURCE_TYPES, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            params: Object.keys(params).length ? params : undefined,
          })
          return NextResponse.json(retryResp.data)
        } catch (refreshErr: unknown) {
          // Suppress noisy stack traces for expected token-refresh failures and return 401
          const r = refreshErr as { message?: string } | undefined
          console.debug('[api/resource-types] token refresh or retry failed:', r?.message)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      // Non-401 errors: log and return the backend status/message
      console.error('API Route /api/resource-types GET error:', ierr?.message || innerErr)
      if (ierr?.response)
        console.debug(
          '[api/resource-types] backend response data:',
          (ierr.response as { data?: unknown })?.data
        )
      return NextResponse.json(
        { error: ierr?.message || 'Internal Server Error' },
        { status: ierr?.response?.status || 500 }
      )
    }
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/resource-types GET error:', error)
    if (err?.response)
      console.debug(
        '[api/resource-types] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
