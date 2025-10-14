'use client'

import { getAccessTokenForClient, getUserProfileForClient } from './server-actions'
import type { UserProfile } from '@/types/auth'

/**
 * Client-side auth utilities
 * These functions work in the browser and can access cookies
 */

/**
 * Get access token from server-side cookies
 * This function calls a server action to get the token
 */
export async function getClientAccessToken(): Promise<string | null> {
  try {
    return await getAccessTokenForClient()
  } catch (error) {
    console.warn('Could not get access token:', error)
    return null
  }
}

/**
 * Get refresh token from client-side cookies
 * Note: This won't work with httpOnly cookies, but we'll keep it for non-httpOnly fallback
 */
export function getClientRefreshToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  try {
    // Get token from document.cookie (only works if cookies are not httpOnly)
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith('refresh_token='))

    if (tokenCookie) {
      return tokenCookie.split('=')[1] || null
    }
  } catch (error) {
    console.warn('Could not read refresh token from cookies:', error)
  }

  return null
}

/**
 * Check if user is authenticated (has access token)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getClientAccessToken()
  return token !== null
}

/**
 * Get user profile
 * This function calls a server action to get the profile
 */
export async function getClientUserProfile(): Promise<UserProfile | null> {
  try {
    return await getUserProfileForClient()
  } catch (error) {
    console.warn('Could not get user profile:', error)
    return null
  }
}

/**
 * Clear all auth cookies (for logout)
 */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') {
    return
  }

  // Clear cookies by setting them to expire in the past
  document.cookie = 'mps_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}
