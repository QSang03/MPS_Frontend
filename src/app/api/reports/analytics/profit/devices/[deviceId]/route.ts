import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest, ctx: unknown) {
  const params = (ctx as Record<string, unknown> | undefined)?.['params'] as
    | Record<string, unknown>
    | undefined
  const deviceId =
    params && typeof params['deviceId'] === 'string' ? (params['deviceId'] as string) : undefined

  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    for (const [k, v] of searchParams.entries()) {
      if (v === null) continue
      const s = String(v).trim()
      if (s === '' || s === 'null' || s === 'undefined') continue
      params[k] = s
    }
    // Set default lang if not provided
    if (!params.lang) params.lang = 'vi'
    const from = params.from
    const to = params.to

    console.log('[API] Device profitability request:', { deviceId, from, to })

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - no access token' },
        { status: 401 }
      )
    }

    if (!deviceId) {
      return NextResponse.json({ success: false, message: 'Missing deviceId' }, { status: 400 })
    }

    const response = await backendApiClient.get(`/reports/analytics/profit/devices/${deviceId}`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('[API] Device profitability response:', response.data)

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as Record<string, unknown>
    const resp = (e['response'] as Record<string, unknown> | undefined) ?? undefined
    const status =
      resp && typeof resp['status'] === 'number' ? (resp['status'] as number) : undefined
    const data = resp && (resp['data'] as Record<string, unknown> | undefined)
    const message =
      data && typeof data['message'] === 'string'
        ? (data['message'] as string)
        : typeof e['message'] === 'string'
          ? (e['message'] as string)
          : undefined

    console.error('[API] Device profitability error:', {
      message,
      status,
      data,
      stack: typeof e['stack'] === 'string' ? (e['stack'] as string) : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        message: message || 'Failed to fetch device profitability',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: status || 500 }
    )
  }
}
