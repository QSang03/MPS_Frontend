import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/reports/usage/pages/monthly
 * Proxy to backend /reports/usage/pages/monthly
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId') ?? undefined
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined
    const deviceId = searchParams.get('deviceId') ?? undefined

    if (!from) {
      return NextResponse.json({ error: 'from is required' }, { status: 400 })
    }

    if (!to) {
      return NextResponse.json({ error: 'to is required' }, { status: 400 })
    }

    const params: Record<string, unknown> = {
      from,
      to,
    }

    // customerId is optional — backend may derive customer from deviceId
    if (customerId) params.customerId = customerId
    // If the backend requires a customerId but the client didn't provide one,
    // try to derive customerId from deviceId so callers (FE) don't need to set it.
    else if (deviceId) {
      try {
        const devRes = await backendApiClient.get(`/devices/${deviceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const derivedCustomerId = devRes?.data?.customer?.id
        if (derivedCustomerId) params.customerId = derivedCustomerId
      } catch (err) {
        // If deriving fails, continue without customerId — backend will respond
        // with a helpful error and we will proxy it back to the client.
        console.warn(
          '[api/reports/usage/pages/monthly] Failed to derive customerId from deviceId',
          err
        )
      }
    }
    if (deviceId) params.deviceId = deviceId

    const response = await backendApiClient.get('/reports/usage/pages/monthly', {
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/reports/usage/pages/monthly] Error:', axiosError.message)

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
