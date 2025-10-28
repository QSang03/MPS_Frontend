import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const hasAccess = !!cookieStore.get('access_token')
    const hasRefresh = !!cookieStore.get('refresh_token')
    console.debug('[api/policies] cookies present:', { hasAccess, hasRefresh })

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward query params from client
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const response = await backendApiClient.get(API_ENDPOINTS.POLICIES, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/policies GET error:', error)
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

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    reqBody = await request.json()

    const response = await backendApiClient.post(API_ENDPOINTS.POLICIES, reqBody, {
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
    console.error('API Route /api/policies POST error:', err?.response?.status || err?.message)
    if (err?.response)
      console.debug(
        '[api/policies] backend response data:',
        (err.response as { data?: unknown })?.data
      )
    // Retry on 401 using refresh token
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

        console.debug('[api/policies] refresh call status:', refreshResp.status)

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

        const retryResp = await backendApiClient.post(API_ENDPOINTS.POLICIES, originalBody, {
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
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

// Operations for specific policy id
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let reqBody: unknown = undefined
  let id: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const paramsObj = await context.params
    id = (paramsObj as { id: string }).id
    reqBody = await request.json()

    const response = await backendApiClient.put(`${API_ENDPOINTS.POLICIES}/${id}`, reqBody, {
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
    console.error('API Route /api/policies PUT error:', err?.response?.status || err?.message)
    // retry on 401 same as POST
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let id: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const paramsObj = await context.params
    id = (paramsObj as { id: string }).id

    const response = await backendApiClient.delete(`${API_ENDPOINTS.POLICIES}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    console.error('API Route /api/policies DELETE error:', err?.response?.status || err?.message)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
