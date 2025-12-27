/**
 * Server-safe translation utility for Server Components
 * Reads locale files directly without React hooks
 */

import viLocale from '@/locales/vi.json'
import enLocale from '@/locales/en.json'
import { cookies, headers } from 'next/headers'

type LocaleMessages = Record<string, string>

const locales: Record<string, LocaleMessages> = {
  vi: viLocale as LocaleMessages,
  en: enLocale as LocaleMessages,
}

/**
 * Get the current locale from cookies or Accept-Language header
 */
export async function getServerLocale(): Promise<'vi' | 'en'> {
  try {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
    if (localeCookie === 'vi' || localeCookie === 'en') {
      return localeCookie
    }

    const headersList = await headers()
    const acceptLang = headersList.get('accept-language') || ''
    if (acceptLang.toLowerCase().includes('vi')) {
      return 'vi'
    }
  } catch {
    // Fallback if cookies/headers not available
  }
  return 'vi' // Default to Vietnamese
}

/**
 * Get translation for a key with optional interpolation
 * Use this in Server Components instead of useLocale()
 */
export function getTranslation(
  locale: 'vi' | 'en',
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = locales[locale] ?? locales.vi
  if (!messages) {
    return key
  }
  const rawValue = messages[key]

  if (!rawValue) {
    // Return key if translation not found
    return key
  }

  let value: string = rawValue

  // Simple interpolation: replace {param} with value
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
    })
  }

  return value
}

/**
 * Create a translator function for a specific locale
 */
export function createServerTranslator(locale: 'vi' | 'en') {
  return (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(locale, key, params)
  }
}
