import 'server-only'
import { getAccessToken, getRefreshToken } from './session'
import axios from 'axios'
import { cookies } from 'next/headers'

const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
const SESSION_COOKIE_NAME = 'mps_session'

/**
 * Ensure we have a valid access token before rendering page.
 * If access token is missing/expired and we have a refresh token,
 * try to refresh it once before proceeding.
 *
 * This should be called at the beginning of Server Components
 * that need authentication to prevent 401 errors during render.
 */
export async function ensureValidToken(): Promise<boolean> {
  const accessToken = await getAccessToken()
  const refreshToken = await getRefreshToken()

  // If we have an access token, assume it's valid (will fail later if expired)
  if (accessToken) {
    return true
  }

  // No access token but have refresh token - try to refresh
  if (refreshToken) {
    try {
      console.log('🔄 Access token missing, attempting refresh before page render...')

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
          validateStatus: (status) => status < 500,
        }
      )

      if (response.status === 200) {
        const responseData = response.data

        // Extract tokens
        let newAccessToken: string | undefined
        let newRefreshToken: string | undefined

        if ('data' in responseData && responseData.data) {
          newAccessToken = responseData.data.accessToken
          newRefreshToken = responseData.data.refreshToken
        } else {
          newAccessToken = responseData.accessToken || responseData.access_token
          newRefreshToken = responseData.refreshToken || responseData.refresh_token
        }

        if (newAccessToken) {
          // Persist new tokens — guarded because this function may be called during
          // server component rendering where cookie writes are not allowed.
          // The middleware handles proactive refresh before rendering, so even if
          // persistence fails here the current request can proceed with the token.
          try {
            const cookieStore = await cookies()
            const isProduction = process.env.NODE_ENV === 'production'

            cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
              httpOnly: true,
              secure: isProduction,
              sameSite: 'lax',
              maxAge: 15 * 60, // 15 minutes
              path: '/',
            })

            if (newRefreshToken) {
              cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
              })
            }
          } catch {
            // Ignore — cannot set cookies during server component rendering.
          }

          console.log('✅ Token refreshed successfully before page render')
          return true
        }
      }

      // Refresh failed
      console.error('❌ Token refresh failed before page render')

      // Clear cookies — guarded for the same reason as above.
      try {
        const cookieStore = await cookies()
        cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME)
        cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
        cookieStore.delete(SESSION_COOKIE_NAME)
      } catch {
        // Ignore
      }

      return false
    } catch (error) {
      console.error('❌ Error refreshing token before page render:', error)
      return false
    }
  }

  // No tokens at all
  return false
}
