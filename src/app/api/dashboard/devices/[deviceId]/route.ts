import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/devices/[deviceId]
 * Device dashboard details - proxies to backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { deviceId } = await params
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!customerId || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerId, from, to' },
        { status: 400 }
      )
    }

    console.log('[api/dashboard/devices] Fetching device details:', {
      deviceId,
      customerId,
      from,
      to,
    })

    // Call backend API
    const response = await backendApiClient.get(`/dashboard/devices/${deviceId}`, {
      params: { customerId, from, to },
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/dashboard/devices] Error:', {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    })

    // Handle 401 - try refresh token
    if (axiosError.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value

        if (!refreshToken) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Refresh token logic (same as overview route)
        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (!refreshResp.ok) {
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }

        const payload = await refreshResp.json()
        const newAccessToken =
          payload?.data?.accessToken || payload?.accessToken || payload?.access_token

        if (!newAccessToken) {
          return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
        }

        // Set new token
        const isProduction = process.env.NODE_ENV === 'production'
        cookieStore.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 15,
          path: '/',
        })

        // Retry request
        const { deviceId } = await params
        const searchParams = request.nextUrl.searchParams
        const customerId = searchParams.get('customerId')!
        const from = searchParams.get('from')!
        const to = searchParams.get('to')!

        const retryResp = await backendApiClient.get(`/dashboard/devices/${deviceId}`, {
          params: { customerId, from, to },
          headers: { Authorization: `Bearer ${newAccessToken}` },
        })

        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const retryError = retryErr as { message?: string; response?: { status?: number } }
        console.error('[api/dashboard/devices] Retry failed:', retryError.message)
        return NextResponse.json(
          { error: retryError.message || 'Internal Server Error' },
          { status: retryError.response?.status || 500 }
        )
      }
    }

    // Forward backend error
    const backendData = axiosError.response?.data
    if (backendData && typeof backendData === 'object') {
      return NextResponse.json(backendData, { status: axiosError.response?.status || 500 })
    }

    return NextResponse.json(
      { error: axiosError.message || 'Internal Server Error' },
      { status: axiosError.response?.status || 500 }
    )
  }
}
