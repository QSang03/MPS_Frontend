import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    console.debug('[api/policies/[id] GET] cookies present:', { hasAccess, hasRefresh })
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = (await params) as { id: string }
    const response = await backendApiClient.get(`${API_ENDPOINTS.POLICIES}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/policies/[id] GET error:', err?.response?.status || err?.message)
    if (err?.response)
      console.debug(
        '[api/policies/[id] GET] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let reqBody: unknown = undefined
  let id: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    console.debug('[api/policies/[id] PUT] cookies present:', { hasAccess, hasRefresh })
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = (await params) as { id: string }
    id = resolvedParams.id
    reqBody = await request.json()
    // Debug: log incoming request body for troubleshooting missing fields
    try {
      console.debug('[api/policies/[id] PUT] incoming body:', JSON.stringify(reqBody))
    } catch {
      console.debug('[api/policies/[id] PUT] incoming body (non-serializable)')
    }

    const response = await backendApiClient.put(`${API_ENDPOINTS.POLICIES}/${id}`, reqBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    // Log backend response for debugging persistence issues
    try {
      console.debug('[api/policies/[id] PUT] backend response:', JSON.stringify(response.data))
    } catch {
      console.debug('[api/policies/[id] PUT] backend response (non-serializable)')
    }
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
          config?: { data?: unknown }
        }
      | undefined
    console.error('API Route /api/policies/[id] PUT error:', err?.response?.status || err?.message)
    if (err?.response)
      console.debug(
        '[api/policies/[id] PUT] backend response data:',
        (err.response as { data?: unknown })?.data
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

        const retryResp = await backendApiClient.put(
          `${API_ENDPOINTS.POLICIES}/${id}`,
          originalBody,
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        )
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

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    console.debug('[api/policies/[id] DELETE] cookies present:', { hasAccess, hasRefresh })
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = (await params) as { id: string }
    const response = await backendApiClient.delete(`${API_ENDPOINTS.POLICIES}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error(
      'API Route /api/policies/[id] DELETE error:',
      err?.response?.status || err?.message
    )
    if (err?.response)
      console.debug(
        '[api/policies/[id] DELETE] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
