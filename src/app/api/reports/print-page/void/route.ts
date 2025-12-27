import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/**
 * POST /api/reports/print-page/void
 * Void (cancel) a print page report - changes status to VOID
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reqBody = await request.json()

    const response = await backendApiClient.post(API_ENDPOINTS.REPORTS.PRINT_PAGE.VOID, reqBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
        }
      | undefined

    console.error('API Route /api/reports/print-page/void POST error:', error)

    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as Record<string, unknown>, {
        status: err?.response?.status || 500,
      })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
