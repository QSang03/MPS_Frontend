import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/consumable-usage-history/devices/[deviceId]
 * Proxy to backend /consumable-usage-history/devices/{deviceId}
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // `params` is a promise-like object in Next.js route handlers; await it before use
    const { params } = context
    const { deviceId } = await params
    const searchParams = request.nextUrl.searchParams

    // Forward all provided query params to the backend. Convert page/limit to numbers when present.
    const paramsObj: Record<string, unknown> = {}
    for (const [k, v] of searchParams.entries()) {
      if (k === 'page' || k === 'limit') {
        const n = Number(v)
        if (!Number.isNaN(n)) paramsObj[k] = n
      } else {
        paramsObj[k] = v
      }
    }

    const response = await backendApiClient.get(
      `/consumable-usage-history/devices/${encodeURIComponent(deviceId)}`,
      {
        params: paramsObj,
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as {
      message?: string
      response?: { status?: number; data?: unknown }
    }
    console.error('[api/consumable-usage-history] Error:', axiosError.message)

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
