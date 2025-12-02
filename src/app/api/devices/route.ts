import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string | number | boolean> = {}
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const deviceModelId = searchParams.get('deviceModelId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    const includeHidden = searchParams.get('includeHidden')
    const isActive = searchParams.get('isActive')

    if (page) {
      const p = Number(page)
      if (!Number.isNaN(p) && p > 0) params.page = p
    }
    if (limit) {
      let l = Number(limit)
      if (!Number.isNaN(l)) {
        if (l > 100) {
          console.debug('[api/devices] requested limit > 100, capping to 100')
          l = 100
        }
        if (l > 0) params.limit = l
      }
    }
    if (deviceModelId) params.deviceModelId = deviceModelId
    if (customerId) params.customerId = customerId
    if (status) params.status = status
    if (search) params.search = search
    if (sortBy) params.sortBy = sortBy
    if (sortOrder) params.sortOrder = sortOrder
    if (typeof includeHidden === 'string') {
      // accept 'true'|'false'|'1'|'0'
      const v = includeHidden.toLowerCase()
      params.includeHidden = v === 'true' || v === '1'
    }
    if (typeof isActive === 'string') {
      const v = isActive.toLowerCase()
      // treat presence of isActive as boolean filter
      params.isActive = v === 'true' || v === '1'
    }

    console.debug('[api/devices] forwarding params:', params)

    const response = await backendApiClient.get(API_ENDPOINTS.DEVICES.LIST, {
      params: Object.keys(params).length ? params : undefined,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/devices GET error:', error)
    // If backend returned structured error body, log and forward it to client for debugging
    const respData = (err as unknown as { response?: { data?: unknown; status?: number } })
      ?.response?.data
    if (respData && typeof respData === 'object') {
      console.debug('[api/devices] backend response data:', respData)
      return NextResponse.json(respData as unknown as Record<string, unknown>, {
        status: (err as unknown as { response?: { status?: number } })?.response?.status || 500,
      })
    }

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

    // Log incoming request body for easier debugging of 4xx/5xx from backend
    try {
      console.debug('[api/devices] incoming POST body:', JSON.stringify(reqBody))
    } catch {
      console.debug('[api/devices] incoming POST body (non-serializable)')
    }

    const response = await backendApiClient.post(API_ENDPOINTS.DEVICES.CREATE, reqBody, {
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
    console.error('API Route /api/devices POST error:', err?.response?.status || err?.message)

    // If we have the backend response body, log it so the frontend/devs can see the JSON error
    const backendRespData = err?.response?.data
    if (typeof backendRespData !== 'undefined') {
      try {
        // Prefer structured JSON logging when possible
        console.error('[api/devices] backend response data:', JSON.stringify(backendRespData))
      } catch {
        // fallback to debug print when non-serializable
        console.error('[api/devices] backend response data (unserializable):', backendRespData)
      }
    }

    // Also log the original request body (if available) to help reproduce the error
    try {
      console.debug('[api/devices] original request body for failed call:', JSON.stringify(reqBody))
    } catch {
      /* ignore */
    }

    // Retry on 401 using refresh token (same pattern used elsewhere)
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

        const retryResp = await backendApiClient.post(API_ENDPOINTS.DEVICES.CREATE, originalBody, {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        })
        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const rerr = retryErr as
          | { message?: string; response?: { status?: number; data?: unknown } }
          | undefined
        console.error('Retry after refresh failed:', rerr?.message)
        return NextResponse.json(
          { error: rerr?.message || 'Internal Server Error' },
          { status: rerr?.response?.status || 500 }
        )
      }
    }

    // Forward backend response body to client when available (object or string)
    if (typeof backendRespData !== 'undefined') {
      const status = err?.response?.status || 500
      if (typeof backendRespData === 'object') {
        return NextResponse.json(backendRespData as unknown as Record<string, unknown>, { status })
      }
      // if backend sent a string or other primitive, wrap it with { error: ... }
      return NextResponse.json({ error: String(backendRespData) }, { status })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
