import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    for (const [k, v] of searchParams.entries()) {
      if (v === null) continue
      const s = String(v).trim()
      if (s === '' || s === 'null' || s === 'undefined') continue
      params[k] = s
    }

    console.log('[API] Consumable lifecycle request:', params)

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - no access token' },
        { status: 401 }
      )
    }

    // Build query params, only include values that are defined and non-null
    // `params` is already built above; it contains only non-empty values

    // Validate required params — backend requires from and to
    // Validate time range: exactly one of period OR (from and to) OR year must be provided
    const hasPeriod = typeof params.period === 'string' && String(params.period).trim() !== ''
    const hasRange = typeof params.from === 'string' && typeof params.to === 'string'
    const hasYear = typeof params.year === 'string' && String(params.year).trim() !== ''
    const validTimeRange = [hasPeriod, hasRange, hasYear].filter(Boolean).length === 1
    if (!validTimeRange) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid time range: provide exactly one of period (YYYY-MM), from/to (YYYY-MM), or year (YYYY)',
        },
        { status: 400 }
      )
    }

    const response = await backendApiClient.get('/reports/analytics/consumables/lifecycle', {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('[API] Consumable lifecycle response:', response.data)

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

    console.error('[API] Consumable lifecycle error:', {
      message,
      status,
      data,
      stack: typeof e['stack'] === 'string' ? (e['stack'] as string) : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        message: message || 'Failed to fetch consumable lifecycle',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: status || 500 }
    )
  }
}
