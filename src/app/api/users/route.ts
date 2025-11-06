import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import axios from 'axios'

type ApiErr = { response?: { data?: unknown; status?: number }; message?: string }

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward query params from client
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Call backend API directly (no interceptor)
    const response = await backendApiClient.get(API_ENDPOINTS.USERS, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as unknown as ApiErr
    console.error('API Route /api/users error:', err)
    const backendData = err?.response?.data
    const status = err?.response?.status || 500
    if (backendData) {
      // Forward backend response body (may include message/details)
      return NextResponse.json(backendData, { status })
    }
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status })
  }
}

export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await backendApiClient.post(API_ENDPOINTS.USERS, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as unknown as ApiErr
    console.error('API Route /api/users POST error:', err?.response?.status || err?.message)

    // Handle 401 from backend: try refresh token ONCE and retry create user
    if (err?.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value

        if (!refreshToken) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Call backend refresh directly (mirror /api/auth/refresh)
        const refreshResp = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
            validateStatus: (s) => s < 500,
          }
        )

        if (refreshResp.status !== 200) {
          // Clear cookies on failed refresh
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }

        const payload = refreshResp.data
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

        // Set new cookies on response
        const isProduction = process.env.NODE_ENV === 'production'
        cookieStore.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 15 * 60,
          path: '/',
        })
        if (newRefreshToken) {
          cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
          })
        }

        // Retry create user immediately using the new access token
        const retryResp = await backendApiClient.post(API_ENDPOINTS.USERS, body, {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        })

        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const retryError = retryErr as unknown as ApiErr
        console.error('Retry after refresh failed:', retryError?.message)
        const backendData = retryError?.response?.data
        const status = retryError?.response?.status || 500
        if (backendData) {
          return NextResponse.json(backendData, { status })
        }
        return NextResponse.json(
          { error: retryError?.message || 'Internal Server Error' },
          { status }
        )
      }
    }
    const backendData = err?.response?.data
    const status = err?.response?.status || 500
    if (backendData) {
      return NextResponse.json(backendData, { status })
    }
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status })
  }
}
