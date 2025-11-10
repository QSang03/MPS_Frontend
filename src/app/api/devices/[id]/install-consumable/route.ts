import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const cleaned = removeEmpty(body as Record<string, unknown>)

    const response = await backendApiClient.post(`/devices/${id}/install-consumable`, cleaned, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: {
            status?: number
            data?: unknown
          }
        }
      | undefined

    console.error('API Route /api/devices/[id]/install-consumable POST error:', error)

    // Return full error response from backend if available
    if (err?.response?.data) {
      return NextResponse.json(err.response.data, { status: err.response.status || 500 })
    }

    // Fallback to simple error message
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
