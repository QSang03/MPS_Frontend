import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/**
 * GET /api/devices/[id]/usage-history
 * Proxy to backend /devices/{id}/usage-history
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { params } = context
    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    const paramsObj: Record<string, unknown> = {}
    for (const [k, v] of searchParams.entries()) {
      paramsObj[k] = v
    }

    const response = await backendApiClient.get(API_ENDPOINTS.DEVICES.USAGE_HISTORY(id), {
      params: paramsObj,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as {
      message?: string
      response?: { status?: number; data?: unknown }
    }
    console.error('[api/devices/[id]/usage-history] Error:', axiosError.message)

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
