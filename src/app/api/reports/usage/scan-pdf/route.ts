import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import FormData from 'form-data'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') ?? undefined
    const deviceId = searchParams.get('deviceId') ?? undefined
    const lang = searchParams.get('lang') ?? undefined

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'Missing deviceId query param' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, message: 'Missing PDF file (field: file)' },
        { status: 400 }
      )
    }

    // Rebuild FormData for Node/axios to ensure multipart boundary is set correctly
    const upstreamForm = new FormData()
    const arrayBuffer = await file.arrayBuffer()
    const filename = (file as { name?: string }).name || 'upload.pdf'
    upstreamForm.append('file', Buffer.from(arrayBuffer), filename)
    const at = formData.get('at')
    if (typeof at === 'string' && at.trim()) {
      upstreamForm.append('at', at.trim())
    }

    const upstream = await backendApiClient.post('/reports/usage/scan-pdf', upstreamForm, {
      headers: {
        ...upstreamForm.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        customerId,
        deviceId,
        lang,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })

    return NextResponse.json(upstream.data)
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    const status = e?.response?.status || 500
    const body =
      e?.response?.data && typeof e.response.data === 'object'
        ? e.response.data
        : { success: false, message: e?.message || 'Scan PDF failed' }
    return NextResponse.json(body as Record<string, unknown>, { status })
  }
}
