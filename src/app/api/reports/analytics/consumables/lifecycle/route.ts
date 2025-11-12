import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const consumableTypeId = searchParams.get('consumableTypeId')
    const customerId = searchParams.get('customerId')

    console.log('[API] Consumable lifecycle request:', { from, to, consumableTypeId, customerId })

    // Get access token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - no access token' },
        { status: 401 }
      )
    }

    const response = await backendApiClient.get('/reports/analytics/consumables/lifecycle', {
      params: {
        from,
        to,
        consumableTypeId: consumableTypeId || undefined,
        customerId: customerId || undefined,
      },
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
