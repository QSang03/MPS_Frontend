import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

/**
 * GET /api/dashboard/overview
 * Fetch dashboard overview for the logged-in user's customer for a month
 * Query params: month (required, format: YYYY-MM)
 * Backend extracts customerId from JWT token
 */
export async function GET(request: NextRequest) {
  // declare at outer scope so catch can reference them when logging
  let params: Record<string, string> | undefined
  let month: string | undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    params = {}
    for (const [k, v] of searchParams.entries()) {
      if (v === null) continue
      const s = String(v).trim()
      if (s === '' || s === 'null' || s === 'undefined') continue
      params[k] = s
    }
    month = params.month

    if (!month) {
      return NextResponse.json({ error: 'month is required' }, { status: 400 })
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    console.log(
      '[api/dashboard/overview] Fetching dashboard overview params:',
      params,
      `customerId from session${params.customerId ? ' (overridden by query param)' : ''}`
    )

    // Backend /dashboard/overview only supports { month, customerId? }.
    // Do not forward unrelated params like `lang` to avoid 400 from strict validation.
    const backendParams: Record<string, string> = { month }
    if (params.customerId) backendParams.customerId = params.customerId

    console.log('[api/dashboard/overview] Forwarding backend params:', backendParams)

    // Call backend API (backend extracts customerId from JWT)
    const response = await backendApiClient.get('/dashboard/overview', {
      params: backendParams,
      headers: { Authorization: `Bearer ${accessToken}` },
    })

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

    console.error('[api/dashboard/overview] Error fetching dashboard overview:', {
      month,
      status,
      message,
      data,
      stack: typeof e['stack'] === 'string' ? (e['stack'] as string) : undefined,
    })

    if (status) {
      return NextResponse.json(data || { error: message || 'Failed to fetch customer overview' }, {
        status,
      })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
