import { refreshAccessToken } from '@/lib/auth/session'

/**
 * Helper to run a server-side API call and if it fails due to authentication,
 * attempt to refresh the access token and retry the call once.
 *
 * Usage:
 * return await withRefreshRetry(() => serverApiClient.put(...))
 */
export class AuthExpiredError extends Error {
  constructor(message = 'Refresh token expired') {
    super(message)
    this.name = 'AuthExpiredError'
  }
}

export async function withRefreshRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error: unknown) {
    // Treat interceptor message as auth failure too
    const isErrorWithMessage = (e: unknown): e is Error =>
      e instanceof Error && typeof (e as Error).message === 'string'
    const isAuthFailedMsg =
      isErrorWithMessage(error) && String(error.message).includes('Authentication failed')

    // Try to read axios-style response status if present
    const status = (error as { response?: { status?: number } })?.response?.status

    if (status === 401 || isAuthFailedMsg) {
      // attempt to refresh access token
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry once with refreshed token
        try {
          return await fn()
        } catch {
          // If retry fails with auth again, attempt one more refresh loop
          const newToken2 = await refreshAccessToken()
          if (newToken2) {
            return await fn()
          }
          // Refresh failed or retry exhausted
          throw new AuthExpiredError()
        }
      }

      // Refresh token invalid or expired
      throw new AuthExpiredError()
    }

    throw error
  }
}

export default withRefreshRetry
