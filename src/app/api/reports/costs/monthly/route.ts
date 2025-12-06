import { NextRequest, NextResponse } from 'next/server'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const month = searchParams.get('month')
    const deviceId = searchParams.get('deviceId')
    const baseCurrencyId = searchParams.get('baseCurrencyId') // ⭐ MỚI

    const resp = await backendApiClient.get('/reports/costs/monthly', {
      params: {
        customerId,
        month,
        deviceId: deviceId || undefined,
        baseCurrencyId: baseCurrencyId || undefined, // ⭐ MỚI
      },
    })
    return NextResponse.json(resp.data)
  } catch (error) {
    console.error('GET /api/reports/costs/monthly error', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch monthly costs' },
      { status: 500 }
    )
  }
}
