import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { removeEmpty } from '@/lib/utils/clean'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await backendApiClient.get(`${API_ENDPOINTS.CONTRACTS}/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] GET error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      return forwardContractMultipart({
        formData,
        accessToken,
        cookieStore,
        method: 'PATCH',
        path: `${API_ENDPOINTS.CONTRACTS}/${id}`,
      })
    }

    const body = await request.json()
    const cleaned = removeEmpty(body as Record<string, unknown>)

    const response = await backendApiClient.patch(`${API_ENDPOINTS.CONTRACTS}/${id}`, cleaned, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] PATCH error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}

interface ForwardMultipartArgs {
  formData: FormData
  accessToken: string
  cookieStore: Awaited<ReturnType<typeof cookies>>
  method: 'POST' | 'PATCH'
  path: string
}

async function forwardContractMultipart({
  formData,
  accessToken,
  cookieStore,
  method,
  path,
}: ForwardMultipartArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_API_URL is not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const endpoint = `${baseUrl}${path}`

  const execute = async (token: string) => {
    const body = cloneFormData(formData)
    return fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    })
  }

  let response = await execute(accessToken)

  if (response.status === 401) {
    const refreshToken = cookieStore.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const refreshResp = await fetch(`${baseUrl}/auth/refresh`, {
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

      if (!newAccessToken) {
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
      }

      const isProduction = process.env.NODE_ENV === 'production'
      cookieStore.set('access_token', newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 15,
        path: '/',
      })
      if (newRefreshToken) {
        cookieStore.set('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
      }

      response = await execute(newAccessToken)
    } catch (err) {
      console.error('Failed to refresh token for contract upload', err)
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }
  }

  const data = await response.json().catch(() => null)
  return NextResponse.json(data ?? {}, { status: response.status })
}

function cloneFormData(source: FormData) {
  const cloned = new FormData()
  source.forEach((value, key) => {
    if (typeof File !== 'undefined' && value instanceof File) {
      cloned.append(key, value, value.name)
    } else {
      cloned.append(key, value as string)
    }
  })
  return cloned
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await backendApiClient.delete(`${API_ENDPOINTS.CONTRACTS}/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status?: number } } | undefined
    console.error('API Route /api/contracts/[id] DELETE error:', error)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: err?.response?.status || 500 }
    )
  }
}
