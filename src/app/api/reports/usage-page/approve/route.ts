import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()

    const upstream = await backendApiClient.post('/reports/usage-page/approve', payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(upstream.data)
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string }
    const status = err?.response?.status || 500
    const body =
      err?.response?.data && typeof err.response.data === 'object'
        ? err.response.data
        : { success: false, message: err?.message || 'Approve usage page failed' }
    return NextResponse.json(body as Record<string, unknown>, { status })
  }
}
