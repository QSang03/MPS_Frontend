import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import backendApiClient from '@/lib/api/backend-client'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // size validation
    // Some runtimes expose .size, otherwise try ArrayBuffer
    let fileSize = (file as unknown as { size?: number }).size
    if (typeof fileSize !== 'number') {
      try {
        const buf = await file.arrayBuffer()
        fileSize = buf.byteLength
      } catch {
        fileSize = 0
      }
    }

    if (fileSize > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
    }

    // Forward the file to backend API using fetch (so multipart/form-data handled automatically)
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/consumable-types/import/excel`

    const forwardForm = new FormData()
    // Re-create File instance so boundary/stream works reliably
    forwardForm.append('file', file, (file as unknown as { name?: string }).name || 'upload.xlsx')

    const resp = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: forwardForm,
    })

    if (resp.status === 401) {
      // try refresh
      const refreshToken = cookieStore.get('refresh_token')?.value
      if (refreshToken) {
        try {
          const refreshResponse = await backendApiClient.post(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          )

          const newAccessToken = refreshResponse.data.data?.access_token
          if (newAccessToken) {
            const retryResp = await fetch(backendUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
              body: forwardForm,
            })

            const json = await retryResp.json().catch(() => null)
            const response = NextResponse.json(json ?? {}, { status: retryResp.status })
            response.cookies.set('access_token', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
            return response
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
        }
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await resp.json().catch(() => null)
    return NextResponse.json(data ?? {}, { status: resp.status })
  } catch (error: unknown) {
    // Narrow unknown error to inspect possible axios-like response
    const err = error as
      | { response?: { data?: unknown; status?: number }; message?: string }
      | undefined
    console.error(
      'Error importing consumable types from excel:',
      err?.response?.data ?? err?.message ?? String(error)
    )
    const responseData = err?.response?.data ?? {}
    const status = err?.response?.status ?? 500
    const maybeError =
      responseData && typeof responseData === 'object' && 'error' in (responseData as object)
        ? (responseData as Record<string, unknown>)['error']
        : undefined

    return NextResponse.json(
      {
        error: String(maybeError ?? 'Failed to import consumable types'),
        data: responseData,
      },
      { status }
    )
  }
}
