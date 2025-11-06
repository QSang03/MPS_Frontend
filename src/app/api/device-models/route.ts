import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    if (!accessToken) {
      const authHeader =
        request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        accessToken = authHeader.slice(7).trim()
      }
    }

    console.debug('[api/device-models] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const params: Record<string, string | number | boolean> = {}
    const page = url.searchParams.get('page')
    const limit = url.searchParams.get('limit')
    const search = url.searchParams.get('search')
    const isActive = url.searchParams.get('isActive')
    const manufacturer = url.searchParams.get('manufacturer')
    const type = url.searchParams.get('type')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder = url.searchParams.get('sortOrder')

    // normalize page and limit; backend enforces a maximum limit (100)
    if (page) {
      const p = Number(page)
      if (!Number.isNaN(p) && p > 0) params.page = p
    }
    if (limit) {
      let l = Number(limit)
      if (!Number.isNaN(l)) {
        if (l > 100) {
          console.debug('[api/device-models] requested limit > 100, capping to 100')
          l = 100
        }
        if (l > 0) params.limit = l
      }
    }
    if (search) params.search = search
    if (typeof isActive === 'string') params.isActive = isActive === 'true'
    if (manufacturer) params.manufacturer = manufacturer
    if (type) params.type = type
    if (sortBy) params.sortBy = sortBy
    if (sortOrder) params.sortOrder = sortOrder

    try {
      const response = await backendApiClient.get(API_ENDPOINTS.DEVICE_MODELS.LIST, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: Object.keys(params).length ? params : undefined,
      })

      return NextResponse.json(response.data)
    } catch (innerErr: unknown) {
      const ierr = innerErr as
        | { response?: { status?: number; data?: unknown }; message?: string }
        | undefined
      if (ierr?.response?.status === 401) {
        console.debug('[api/device-models] backend responded 401 — attempting token refresh')
        try {
          const cookieStore = await cookies()
          const refreshToken = cookieStore.get('refresh_token')?.value
          if (!refreshToken) {
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

          const retryResp = await backendApiClient.get(API_ENDPOINTS.DEVICE_MODELS.LIST, {
            headers: { Authorization: `Bearer ${newAccessToken}` },
            params: Object.keys(params).length ? params : undefined,
          })
          return NextResponse.json(retryResp.data)
        } catch (refreshErr: unknown) {
          const r = refreshErr as { message?: string } | undefined
          console.debug('[api/device-models] token refresh or retry failed:', r?.message)
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }

      console.error('API Route /api/device-models GET error:', ierr?.message || innerErr)
      if (ierr?.response)
        console.debug(
          '[api/device-models] backend response data:',
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
    console.error('API Route /api/device-models GET error:', error)
    if (err?.response)
      console.debug(
        '[api/device-models] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let reqBody: unknown = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    reqBody = await request.json()

    const response = await backendApiClient.post(API_ENDPOINTS.DEVICE_MODELS.CREATE, reqBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
          config?: { data?: unknown }
        }
      | undefined
    console.error(
      'API Route /api/device-models POST error:',
      err?.response?.status || err?.message,
      'responseData:',
      err?.response?.data
    )

    if (err?.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value
        if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

        const originalBody =
          typeof reqBody !== 'undefined'
            ? reqBody
            : err?.config?.data && typeof err.config.data === 'string'
              ? JSON.parse(String(err.config.data))
              : {}

        const retryResp = await backendApiClient.post(
          API_ENDPOINTS.DEVICE_MODELS.CREATE,
          originalBody,
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        )
        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const rerr = retryErr as { message?: string } | undefined
        console.error('Retry after refresh failed:', rerr?.message)
        return NextResponse.json(
          { error: rerr?.message || 'Internal Server Error' },
          { status: 500 }
        )
      }
    }

    // If backend provided structured error body, forward it to the client for easier debugging
    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as any, { status: err.response?.status || 500 })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
