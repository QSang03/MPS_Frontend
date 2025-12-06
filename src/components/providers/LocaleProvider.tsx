'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getUserProfileForClient } from '@/lib/auth/server-actions'
import { updateUserLanguagePreference, setLanguage as setLanguageUtil } from '@/lib/utils/language'

export type Locale = 'vi' | 'en'

type Messages = Record<string, string>

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const defaultMessages: Messages = {}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    if (locale === 'vi') {
      const messages = await import('@/locales/vi.json')
      return messages.default ?? messages
    }
    const messages = await import('@/locales/en.json')
    return messages.default ?? messages
  } catch (err) {
    console.warn('Failed to load messages for locale', locale, err)
    return {}
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleRaw] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'vi'
    try {
      const stored = localStorage.getItem('mps_locale')
      if (stored === 'en' || stored === 'vi') return stored as Locale
    } catch {
      // ignore
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.language) {
        const lang = navigator.language.toLowerCase()
        if (lang.startsWith('en')) return 'en'
      }
    } catch {
      // ignore
    }
    return 'vi'
  })
  const [messages, setMessages] = useState<Messages>(defaultMessages)

  // removed initial storage effect in favor of lazy initializer; no initial setState needed here

  useEffect(() => {
    let cancelled = false
    loadMessages(locale).then((m) => {
      if (!cancelled) setMessages(m)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    // Update document lang for better accessibility & SEO when available
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = locale
      }
    } catch {
      // ignore
    }
  }, [locale])

  // Sync language from user profile when component mounts
  useEffect(() => {
    let cancelled = false

    const syncLanguageFromProfile = async () => {
      try {
        const profile = await getUserProfileForClient()
        if (cancelled || !profile) return

        // Check if user has language preference
        const userLanguage =
          (profile.user as { language?: Locale })?.language ||
          (profile.user.attributes as { language?: Locale } | undefined)?.language

        if (userLanguage === 'en' || userLanguage === 'vi') {
          // Update localStorage and state
          setLanguageUtil(userLanguage)
          setLocaleRaw(userLanguage)
        }
      } catch (error) {
        // Silently fail - user might not be logged in
        console.debug('Could not sync language from profile:', error)
      }
    }

    // Only sync if user is likely authenticated (check for access token cookie)
    if (typeof document !== 'undefined') {
      const hasAuthCookie = document.cookie.includes('access_token=')
      if (hasAuthCookie) {
        syncLanguageFromProfile()
      }
    }

    return () => {
      cancelled = true
    }
  }, []) // Only run once on mount

  const setLocale = useCallback((l: Locale) => {
    setLocaleRaw(l)
    setLanguageUtil(l)

    // Update user preference in database if user is authenticated
    if (typeof document !== 'undefined') {
      const hasAuthCookie = document.cookie.includes('access_token=')
      if (hasAuthCookie) {
        updateUserLanguagePreference(l).catch((error) => {
          console.debug('Failed to update user language preference:', error)
        })
      }
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const v = messages[key]
      if (!v) {
        if (process.env.NODE_ENV !== 'production') console.warn('Missing translation for', key)
        return ''
      }
      if (!params) return v
      // Simple interpolation: replace {key} with params[key]
      return v.replace(/\{(\w+)\}/g, (match, paramKey) => {
        const value = params[paramKey]
        return value !== undefined ? String(value) : match
      })
    },
    [messages]
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function withLocale<T extends Record<string, unknown>>(Component: React.ComponentType<T>) {
  return function Wrapper(props: T) {
    return (
      <LocaleProvider>
        <Component {...props} />
      </LocaleProvider>
    )
  }
}

export default LocaleProvider
