import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Forward query parameters to backend aggregation job (backend expects ?month=YYYY-MM)
    const reqUrl = new URL(request.url)
    const search = reqUrl.search || ''
    const backendPath = `/reports/jobs/monthly-aggregation${search}`
    // POST with no body; parameters are passed via query string
    const response = await backendApiClient.post(backendPath, undefined, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const axiosError = error as { message?: string; response?: { status?: number; data?: unknown } }
    console.error('[api/reports/jobs/monthly-aggregation] Error:', axiosError.message)

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
