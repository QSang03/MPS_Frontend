import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import backendApiClient from '@/lib/api/backend-client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const search = searchParams.get('search')
    const isActiveParam = searchParams.get('isActive')

    const params: any = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (search) params.search = search
    if (isActiveParam !== null) {
      // Convert string 'true'/'false' to boolean
      params.isActive = isActiveParam === 'true'
    }

    const response = await backendApiClient.get(API_ENDPOINTS.CONSUMABLE_TYPES.LIST, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching consumable types:', error.response?.data || error.message)

    if (error.response?.status === 401) {
      const cookieStore = await cookies()
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
            const { searchParams } = new URL(request.url)
            const page = searchParams.get('page')
            const limit = searchParams.get('limit')
            const search = searchParams.get('search')
            const isActiveParam = searchParams.get('isActive')

            const params: any = {}
            if (page) params.page = page
            if (limit) params.limit = limit
            if (search) params.search = search
            if (isActiveParam !== null) {
              // Convert string 'true'/'false' to boolean
              params.isActive = isActiveParam === 'true'
            }

            const retryResponse = await backendApiClient.get(API_ENDPOINTS.CONSUMABLE_TYPES.LIST, {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
              params,
            })

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
      {
        error: responseData.error || 'Failed to fetch consumable types',
        data: responseData,
      },
      { status: error.response?.status || 500 }
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

    const body = await request.json()

    const response = await backendApiClient.post(API_ENDPOINTS.CONSUMABLE_TYPES.CREATE, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return NextResponse.json(response.data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating consumable type:', error.response?.data || error.message)

    if (error.response?.status === 401) {
      const cookieStore = await cookies()
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
            const body = await request.json()

            const retryResponse = await backendApiClient.post(
              API_ENDPOINTS.CONSUMABLE_TYPES.CREATE,
              body,
              {
                headers: {
                  Authorization: `Bearer ${newAccessToken}`,
                },
              }
            )

            const IS_SECURE_COOKIES =
              process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'

            const response = NextResponse.json(retryResponse.data, {
              status: 201,
            })
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
      {
        error: responseData.error || 'Failed to create consumable type',
        data: responseData,
      },
      { status: error.response?.status || 500 }
    )
  }
}
