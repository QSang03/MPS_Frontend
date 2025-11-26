import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import axios from 'axios'

const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
const SESSION_COOKIE_NAME = 'mps_session'

/**
 * Route Handler for refreshing access token
 * This is the ONLY place where we can safely modify cookies during token refresh
 */
export async function POST() {
  try {
    // Get refresh token from cookies
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 })
    }

    // Call backend refresh API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        refreshToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        validateStatus: (status) => status < 500,
      }
    )

    // Handle failed refresh
    if (response.status !== 200) {
      // Clear all auth cookies
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }

    const responseData = response.data

    // Extract tokens from response
    let newAccessToken: string | undefined
    let newRefreshToken: string | undefined

    if ('data' in responseData && responseData.data) {
      newAccessToken = responseData.data.accessToken
      newRefreshToken = responseData.data.refreshToken
    } else {
      newAccessToken = responseData.accessToken || responseData.access_token
      newRefreshToken = responseData.refreshToken || responseData.refresh_token
    }

    if (!newAccessToken) {
      // Clear all auth cookies
      cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
      cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
      cookieStore.delete(SESSION_COOKIE_NAME)

      return NextResponse.json({ error: 'No access token in response' }, { status: 401 })
    }

    // Update cookies with new tokens
    const IS_SECURE_COOKIES =
      process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'

    cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: IS_SECURE_COOKIES,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    if (newRefreshToken) {
      cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
        httpOnly: true,
        secure: IS_SECURE_COOKIES,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      })
    }

    // Return new access token
    return NextResponse.json({
      accessToken: newAccessToken,
      success: true,
    })
  } catch (error) {
    console.error('Token refresh error:', error)

    // Clear cookies on error
    const cookieStore = await cookies()
    cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
    cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
    cookieStore.delete(SESSION_COOKIE_NAME)

    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 })
  }
}
