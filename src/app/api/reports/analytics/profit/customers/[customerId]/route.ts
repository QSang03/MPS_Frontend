import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest, ctx: unknown) {
  const params = (ctx as Record<string, unknown> | undefined)?.['params'] as
    | Record<string, unknown>
    | undefined
  const customerId =
    params && typeof params['customerId'] === 'string'
      ? (params['customerId'] as string)
      : undefined

  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')

    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId' }, { status: 400 })
    }

    console.log('[API] Customer detail profit request:', { customerId, period })

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - no access token' },
        { status: 401 }
      )
    }

    const response = await backendApiClient.get(
      `/reports/analytics/profit/customers/${customerId}`,
      {
        params: { period },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    console.log('[API] Customer detail profit response:', response.data)

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

    console.error('[API] Customer detail profit error:', {
      message,
      status,
      data,
      stack: typeof e['stack'] === 'string' ? (e['stack'] as string) : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        message: message || 'Failed to fetch customer profit detail',
        error: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: status || 500 }
    )
  }
}
