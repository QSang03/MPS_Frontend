import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'
import type { AxiosError } from 'axios'

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

    // Log the cleaned payload to help debug validation/overflow issues
    console.debug('/api/devices/[id]/page-printing-costs POST - forwarding payload:', cleaned)

    const response = await backendApiClient.post(`/devices/${id}/page-printing-costs`, cleaned, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    // Try to extract Axios response body/status for better debugging and forward it
    const e = error as AxiosError<unknown>
    try {
      if (e?.response) {
        // Log detailed backend response body and status
        console.error(
          'API Route /api/devices/[id]/page-printing-costs POST error - backend response:',
          {
            status: e.response.status,
            data: e.response.data,
          }
        )

        // Forward backend response body and status back to client for visibility
        return NextResponse.json(e.response.data || { error: e.message || 'Bad Request' }, {
          status: e.response.status || 400,
        })
      }
    } catch (logErr) {
      console.error('Error while logging Axios error response', logErr)
    }

    console.error('API Route /api/devices/[id]/page-printing-costs POST unexpected error:', error)
    const status = (e?.response?.status as number) || 500
    const message = e?.message || 'Internal Server Error'
    return NextResponse.json({ error: message }, { status })
  }
}
