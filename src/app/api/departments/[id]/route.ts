import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const response = await backendApiClient.get(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('API Route /api/departments/[id] GET error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: error?.response?.status || 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let reqBody: any = undefined
  let id: string | undefined = undefined
  try {
    const paramsObj = await params
    id = paramsObj.id
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    reqBody = await request.json()
    const response = await backendApiClient.put(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, reqBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error(
      'API Route /api/departments/[id] PUT error:',
      error?.response?.status || error?.message
    )
    if (error?.response?.status === 401) {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refresh_token')?.value
        if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const refreshResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResp.status !== 200) {
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
          cookieStore.delete('access_token')
          cookieStore.delete('refresh_token')
          cookieStore.delete('mps_session')
          return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
        }

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

        const originalBody =
          typeof reqBody !== 'undefined'
            ? reqBody
            : error?.config?.data && typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : {}
        const retryResp = await backendApiClient.put(
          `${API_ENDPOINTS.DEPARTMENTS}/${id}`,
          originalBody,
          { headers: { Authorization: `Bearer ${newAccessToken}` } }
        )
        return NextResponse.json(retryResp.data)
      } catch (retryErr: any) {
        console.error('Retry after refresh failed:', retryErr?.message)
        return NextResponse.json(
          { error: retryErr?.message || 'Internal Server Error' },
          { status: retryErr?.response?.status || 500 }
        )
      }
    }

    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: error?.response?.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await backendApiClient.delete(`${API_ENDPOINTS.DEPARTMENTS}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Route /api/departments/[id] DELETE error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: error?.response?.status || 500 }
    )
  }
}
