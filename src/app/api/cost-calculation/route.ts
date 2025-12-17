import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function buildParams(searchParams: URLSearchParams) {
  const params: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    const v = String(value ?? '').trim()
    if (!v || v === 'null' || v === 'undefined') continue
    params[key] = v
  }
  return params
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const params = buildParams(request.nextUrl.searchParams)
    const response = await backendApiClient.get(API_ENDPOINTS.COST_CALCULATION.LIST, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: unknown }; message?: string }
    console.error('[API] cost-calculation GET error:', e?.message, e?.response?.data)
    const status = e?.response?.status || 500
    return NextResponse.json(
      {
        success: false,
        message: e?.message || 'Failed to fetch cost calculation history',
        error: process.env.NODE_ENV === 'development' ? e?.response?.data : undefined,
      },
      { status }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    const customerName = (form.get('customerName') as string | null) ?? ''
    const deviceLineName = (form.get('deviceLineName') as string | null) ?? ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

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

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.COST_CALCULATION.LIST}`

    const forwardForm = new FormData()
    forwardForm.append('file', file, (file as unknown as { name?: string }).name || 'upload.xlsx')
    if (customerName.trim()) forwardForm.append('customerName', customerName.trim())
    if (deviceLineName.trim()) forwardForm.append('deviceLineName', deviceLineName.trim())

    const resp = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: forwardForm,
    })

    if (resp.status === 401) {
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

          const newAccessToken = (refreshResponse.data as { data?: { access_token?: string } })
            ?.data?.access_token
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
            const IS_SECURE_COOKIES =
              process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'
            response.cookies.set('access_token', newAccessToken, {
              httpOnly: true,
              secure: IS_SECURE_COOKIES,
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
    const err = error as
      | { response?: { data?: unknown; status?: number }; message?: string }
      | undefined
    console.error(
      'Error creating cost calculation:',
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
        error: String(maybeError ?? 'Failed to create cost calculation'),
        data: responseData,
      },
      { status }
    )
  }
}
