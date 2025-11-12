import { NextRequest, NextResponse } from 'next/server'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const deviceId = searchParams.get('deviceId')

    const resp = await backendApiClient.get('/reports/costs/monthly/series', {
      params: {
        customerId,
        from,
        to,
        deviceId: deviceId || undefined,
      },
    })
    return NextResponse.json(resp.data)
  } catch (error) {
    console.error('GET /api/reports/costs/monthly/series error', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch series' }, { status: 500 })
  }
}
