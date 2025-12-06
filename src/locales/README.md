# Localization (i18n) for MPS

This project includes a simple client-side localization system implemented with:

- `LocaleProvider` (client provider) that loads messages from `src/locales/{locale}.json` dynamically
- `LanguageSwitcher` component lets users toggle between `vi` (Vietnamese) and `en` (English)
- `useLocale()` hook that exposes `t(key)`, `locale`, and `setLocale()`

How to use:

- Wrap your app with `LocaleProvider` (already in `src/app/layout.tsx`)
- Use `useLocale()` in client components to access `t`:
  - `const { t, locale, setLocale } = useLocale()`
  - `t('nav.devices') // returns translated string` (no fallback; absent keys return blank)

Where to add translations:

- English translations: `src/locales/en.json`
- Vietnamese translations: `src/locales/vi.json`

Key naming convention:

- `nav.*` for navigation items (use `name` from navigation payload where possible)
- `sidebar.*` for sidebar texts
- `footer.*` for footer texts
- `profile`, `user`, `settings.account`, `logout`, `logout.confirm.title`, `logout.confirm.description`, `cancel` are general keys used in Navbar and Profile dropdown

Server-side pages:

- Pages in `src/app` are server components by default; use client components or client wrappers to get translated strings during hydration if needed.

Notes:

- This implementation provides a quick client-side translation setup that falls back to provided labels. For full Next.js server-side localization (i18n routing), consider using `next-intl` or Next.js built-in i18n features.
- To add more keys, edit the JSON files and use `t('your.key')` in components.
