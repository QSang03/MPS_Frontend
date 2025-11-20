import { NextRequest, NextResponse } from 'next/server'
import backendApiClient from '@/lib/api/backend-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const month = searchParams.get('month')
    const deviceId = searchParams.get('deviceId')

    const resp = await backendApiClient.get('/reports/monthly/export/csv', {
      params: {
        customerId: customerId || undefined,
        month: month || undefined,
        deviceId: deviceId || undefined,
      },
    })

    return NextResponse.json(resp.data)
  } catch (error) {
    console.error('GET /api/reports/monthly/export/csv error', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate CSV report' },
      { status: 500 }
    )
  }
}
