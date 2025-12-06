/**
 * Language utility functions
 * Manages language preference in localStorage and syncs with backend
 */

export type Locale = 'vi' | 'en'

const LOCALE_STORAGE_KEY = 'mps_locale'

/**
 * Get current language preference
 * Priority:
 * 1. localStorage (mps_locale)
 * 2. Browser language setting
 * 3. Default to 'vi'
 */
export function getLanguage(): Locale {
  if (typeof window === 'undefined') {
    return 'vi'
  }

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'vi') {
      return stored as Locale
    }
  } catch {
    // ignore localStorage errors
  }

  // Fallback to browser language
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase()
      if (lang.startsWith('en')) {
        return 'en'
      }
    }
  } catch {
    // ignore
  }

  return 'vi'
}

/**
 * Set language preference in localStorage
 * Note: This does NOT update user preference in database
 * Use updateUserLanguagePreference() for that
 */
export function setLanguage(locale: Locale): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore localStorage errors
  }
}

/**
 * Update user language preference in database
 * This should be called when user is authenticated
 * Backend endpoint: PATCH /auth/profile
 */
export async function updateUserLanguagePreference(locale: Locale): Promise<void> {
  try {
    // Call API to update user preference via /api/profile (which calls /auth/profile on backend)
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ language: locale }),
    })

    if (!response.ok) {
      console.warn('Failed to update user language preference:', response.status)
    }
  } catch (error) {
    console.error('Error updating user language preference:', error)
    // Don't throw - this is not critical
  }
}
