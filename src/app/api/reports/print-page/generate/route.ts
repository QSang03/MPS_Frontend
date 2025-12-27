import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

/**
 * POST /api/reports/print-page/generate
 * Generate print page report (manual or preview with dryRun)
 */
export async function POST(request: NextRequest) {
  let reqBody: unknown = undefined
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    reqBody = await request.json()

    const response = await backendApiClient.post(
      API_ENDPOINTS.REPORTS.PRINT_PAGE.GENERATE,
      reqBody,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    return NextResponse.json(response.data, { status: 201 })
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
          config?: { data?: unknown }
        }
      | undefined

    console.error('API Route /api/reports/print-page/generate POST error:', error)

    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as unknown as Record<string, unknown>, {
        status: err?.response?.status || 500,
      })
    }

    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
