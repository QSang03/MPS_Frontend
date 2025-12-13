import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

interface RouteParams {
  params: Promise<{ deviceId: string }>
}

// GET maintenance histories by device ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deviceId } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const paramsObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (value !== undefined && value !== null && value !== '') paramsObj[key] = value
    })

    const response = await backendApiClient.get(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.BY_DEVICE(deviceId),
      {
        params: paramsObj,
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as
      | { message?: string; response?: { status?: number; data?: unknown } }
      | undefined
    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as Record<string, unknown>, {
        status: err.response?.status || 500,
      })
    }
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

// CREATE maintenance history by device ID
export async function POST(request: NextRequest, { params }: RouteParams) {
  let originalBody: unknown = undefined
  try {
    const { deviceId } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    // If it's multipart/form-data (contains images), forward as multipart
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      return await forwardMultipart({ deviceId, formData, accessToken })
    }

    originalBody = await request.json()
    const cleaned = removeEmpty(originalBody as Record<string, unknown>)

    const resp = await backendApiClient.post(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.CREATE_BY_DEVICE(deviceId),
      cleaned,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )
    return NextResponse.json(resp.data)
  } catch (error: unknown) {
    const err = error as
      | {
          message?: string
          response?: { status?: number; data?: unknown }
          config?: { data?: unknown }
        }
      | undefined

    if (err?.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value
        if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!refreshResp.ok) {
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }

        const payload = await refreshResp.json()
        const newAccessToken =
          payload?.data?.accessToken || payload?.accessToken || payload?.access_token
        const newRefreshToken =
          payload?.data?.refreshToken || payload?.refreshToken || payload?.refresh_token
        if (!newAccessToken)
          return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })

        const isProduction = process.env.NODE_ENV === 'production'
        cookieStore.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 15,
          path: '/',
        })
        if (newRefreshToken)
          cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })

        const bodyForRetry =
          typeof originalBody !== 'undefined'
            ? originalBody
            : err?.config?.data && typeof err.config.data === 'string'
              ? JSON.parse(String(err.config.data))
              : {}
        const cleanedRetry = removeEmpty(bodyForRetry as Record<string, unknown>)
        const retryResp = await backendApiClient.post(
          API_ENDPOINTS.MAINTENANCE_HISTORIES.CREATE_BY_DEVICE(deviceId),
          cleanedRetry,
          {
            headers: { Authorization: `Bearer ${newAccessToken}` },
          }
        )
        return NextResponse.json(retryResp.data)
      } catch (retryErr: unknown) {
        const rerr = retryErr as { message?: string } | undefined
        return NextResponse.json(
          { error: rerr?.message || 'Internal Server Error' },
          { status: 500 }
        )
      }
    }

    if (err?.response?.data && typeof err.response.data === 'object') {
      return NextResponse.json(err.response.data as Record<string, unknown>, {
        status: err.response?.status || 500,
      })
    }
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

async function forwardMultipart({
  deviceId,
  formData,
  accessToken,
}: {
  deviceId: string
  formData: FormData
  accessToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_API_URL is not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const endpoint = `${baseUrl}${API_ENDPOINTS.MAINTENANCE_HISTORIES.CREATE_BY_DEVICE(deviceId)}`

  const cloned = new FormData()
  formData.forEach((value, key) => {
    if (typeof File !== 'undefined' && value instanceof File) {
      cloned.append(key, value, value.name)
    } else {
      cloned.append(key, value as string)
    }
  })

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: cloned,
  })

  const data = await resp.json().catch(() => null)
  return NextResponse.json(data ?? {}, { status: resp.status })
}
