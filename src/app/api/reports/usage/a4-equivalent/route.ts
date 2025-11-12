import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * POST /api/reports/usage/a4-equivalent
 * Proxy to backend /reports/usage/a4-equivalent
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Basic validation: require deviceId and recordedAt (backend may be more permissive)
    if (!body || !body.deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
    }

    const response = await backendApiClient.post('/reports/usage/a4-equivalent', body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/reports/usage/a4-equivalent] Error:', axiosError.message)

    if (axiosError.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendData = axiosError.response?.data
    if (backendData && typeof backendData === 'object') {
      return NextResponse.json(backendData, { status: axiosError.response?.status || 500 })
    }

    return NextResponse.json(
      { error: axiosError.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
