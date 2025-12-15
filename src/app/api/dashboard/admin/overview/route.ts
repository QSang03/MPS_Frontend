import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/admin/overview
 * Admin dashboard overview - proxies to backend
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const lang = searchParams.get('lang') || 'vi'
    const baseCurrencyId = searchParams.get('baseCurrencyId')

    const params: Record<string, string> = { lang }
    if (month) params.month = month
    if (baseCurrencyId) params.baseCurrencyId = baseCurrencyId

    console.log('[api/dashboard/admin/overview] Fetching with params:', params)

    // Call backend API
    const response = await backendApiClient.get('/dashboard/admin/overview', {
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    console.log('[api/dashboard/admin/overview] Backend response status:', response.status)

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/dashboard/admin/overview] Error:', {
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

        // Refresh token
        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (!refreshResp.ok) {
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
          return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
        }

        // Set new tokens
        const isProduction = process.env.NODE_ENV === 'production'
        cookieStore.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 15,
          path: '/',
        })

        if (newRefreshToken) {
          cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })
        }

        // Retry request with new token
        const searchParams = request.nextUrl.searchParams
        const month = searchParams.get('month')
        const lang = searchParams.get('lang') || 'vi'
        const baseCurrencyId = searchParams.get('baseCurrencyId')

        const params: Record<string, string> = { lang }
        if (month) params.month = month
        if (baseCurrencyId) params.baseCurrencyId = baseCurrencyId

        const retryResp = await backendApiClient.get('/dashboard/admin/overview', {
          params,
          headers: { Authorization: `Bearer ${newAccessToken}` },
        })

        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const retryError = retryErr as { message?: string; response?: { status?: number } }
        console.error('[api/dashboard/admin/overview] Retry failed:', retryError.message)
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
