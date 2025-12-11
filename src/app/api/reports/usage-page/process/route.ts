import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import FormData from 'form-data'
import backendApiClient from '@/lib/api/backend-client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, message: 'Missing image file (field: file)' },
        { status: 400 }
      )
    }

    const upstreamForm = new FormData()
    const arrayBuffer = await file.arrayBuffer()
    const filename = (file as { name?: string }).name || 'upload.jpg'
    upstreamForm.append('file', Buffer.from(arrayBuffer), filename)

    // Forward any additional string fields (e.g., recordedAt) if present
    for (const [key, value] of formData.entries()) {
      if (key === 'file') continue
      if (typeof value === 'string') {
        upstreamForm.append(key, value)
      }
    }

    const upstream = await backendApiClient.post('/reports/usage-page/process', upstreamForm, {
      headers: {
        ...upstreamForm.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })

    return NextResponse.json(upstream.data)
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string }
    const status = err?.response?.status || 500
    const body =
      err?.response?.data && typeof err.response.data === 'object'
        ? err.response.data
        : { success: false, message: err?.message || 'Process usage page failed' }
    return NextResponse.json(body as Record<string, unknown>, { status })
  }
}
