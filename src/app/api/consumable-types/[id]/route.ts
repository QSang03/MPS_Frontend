import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import removeEmpty from '@/lib/utils/clean'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const response = await backendApiClient.get(API_ENDPOINTS.CONSUMABLE_TYPES.DETAIL(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching consumable type:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get('refresh_token')?.value

      if (refreshToken) {
        try {
          const refreshResponse = await backendApiClient.post(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )

          const newAccessToken = refreshResponse.data.data?.access_token
          if (newAccessToken) {
            const retryResponse = await backendApiClient.get(
              API_ENDPOINTS.CONSUMABLE_TYPES.DETAIL(id),
              { headers: { Authorization: `Bearer ${newAccessToken}` } }
            )

            const IS_SECURE_COOKIES =
              process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'

            const response = NextResponse.json(retryResponse.data)
            response.cookies.set('access_token', newAccessToken, {
              httpOnly: true,
              secure: IS_SECURE_COOKIES,
              sameSite: 'lax',
              path: '/',
            })
            return response
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const responseData = error.response?.data || {}
    return NextResponse.json(
      { error: responseData.error || 'Failed to fetch consumable type', data: responseData },
      { status: error.response?.status || 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const body = await request.json()
    const cleaned = removeEmpty(body as Record<string, unknown>)
    const response = await backendApiClient.patch(
      API_ENDPOINTS.CONSUMABLE_TYPES.UPDATE(id),
      cleaned,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error updating consumable type:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get('refresh_token')?.value

      if (refreshToken) {
        try {
          const refreshResponse = await backendApiClient.post(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )

          const newAccessToken = refreshResponse.data.data?.access_token
          if (newAccessToken) {
            const body = await request.json()
            const cleanedRetry = removeEmpty(body as Record<string, unknown>)
            const retryResponse = await backendApiClient.patch(
              API_ENDPOINTS.CONSUMABLE_TYPES.UPDATE(id),
              cleanedRetry,
              { headers: { Authorization: `Bearer ${newAccessToken}` } }
            )

            const response = NextResponse.json(retryResponse.data)

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
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const responseData = error.response?.data || {}
    return NextResponse.json(
      { error: responseData.error || 'Failed to update consumable type', data: responseData },
      { status: error.response?.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const response = await backendApiClient.delete(API_ENDPOINTS.CONSUMABLE_TYPES.DELETE(id), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error deleting consumable type:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get('refresh_token')?.value

      if (refreshToken) {
        try {
          const refreshResponse = await backendApiClient.post(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )

          const newAccessToken = refreshResponse.data.data?.access_token
          if (newAccessToken) {
            const retryResponse = await backendApiClient.delete(
              API_ENDPOINTS.CONSUMABLE_TYPES.DELETE(id),
              { headers: { Authorization: `Bearer ${newAccessToken}` } }
            )

            const IS_SECURE_COOKIES =
              process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'

            const response = NextResponse.json(retryResponse.data)
            response.cookies.set('access_token', newAccessToken, {
              httpOnly: true,
              secure: IS_SECURE_COOKIES,
              sameSite: 'lax',
              path: '/',
            })
            return response
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
        }
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const responseData = error.response?.data || {}
    return NextResponse.json(
      { error: responseData.error || 'Failed to delete consumable type', data: responseData },
      { status: error.response?.status || 500 }
    )
  }
}
