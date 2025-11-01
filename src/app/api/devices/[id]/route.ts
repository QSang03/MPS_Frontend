import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import removeEmpty from '@/lib/utils/clean'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = (await params) as { id: string }

    const response = await backendApiClient.get(API_ENDPOINTS.DEVICES.DETAIL(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: {
            status?: number
            data?: { message?: string; error?: string; statusCode?: number }
          }
        }
      | undefined
    console.error('API Route /api/devices/[id] GET error:', err?.response?.status || err?.message)

    // Return backend error message if available
    const backendMessage = err?.response?.data?.message || err?.message || 'Internal Server Error'
    return NextResponse.json(
      { error: backendMessage, message: backendMessage },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let reqBody: unknown = undefined
  let id: string | undefined = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const resolvedParams = (await params) as { id: string }
    id = resolvedParams.id
    reqBody = await request.json()
    const cleaned = removeEmpty(reqBody as Record<string, unknown>)

    const response = await backendApiClient.patch(API_ENDPOINTS.DEVICES.UPDATE(id), cleaned, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: {
            status?: number
            data?: { message?: string; error?: string; statusCode?: number }
          }
          config?: { data?: unknown }
        }
      | undefined
    console.error('API Route /api/devices/[id] PATCH error:', {
      status: err?.response?.status,
      message: err?.message,
      backendData: err?.response?.data,
    })

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

        const retryBody = removeEmpty(originalBody as Record<string, unknown>)

        const retryResp = await backendApiClient.patch(
          API_ENDPOINTS.DEVICES.UPDATE(id || ''),
          retryBody,
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        )
        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const rerr = retryErr as
          | {
              message?: string
              response?: { status?: number; data?: { message?: string; error?: string } }
            }
          | undefined
        console.error('Retry after refresh failed:', rerr?.message)

        // Return backend error message if available
        const retryBackendMessage =
          rerr?.response?.data?.message || rerr?.message || 'Internal Server Error'
        return NextResponse.json(
          { error: retryBackendMessage, message: retryBackendMessage },
          { status: rerr?.response?.status || 500 }
        )
      }
    }

    // Return backend error message if available
    const backendMessage = err?.response?.data?.message || err?.message || 'Internal Server Error'
    return NextResponse.json(
      { error: backendMessage, message: backendMessage },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = (await params) as { id: string }

    const response = await backendApiClient.delete(API_ENDPOINTS.DEVICES.DELETE(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: { message?: string; error?: string } }
        }
      | undefined
    console.error(
      'API Route /api/devices/[id] DELETE error:',
      err?.response?.status || err?.message
    )

    // Return backend error message if available
    const backendMessage = err?.response?.data?.message || err?.message || 'Internal Server Error'
    return NextResponse.json(
      { error: backendMessage, message: backendMessage },
      { status: err?.response?.status || 500 }
    )
  }
}
