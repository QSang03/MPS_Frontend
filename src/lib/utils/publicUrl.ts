export function getPublicUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null
  // If running in browser, prefer same-origin proxied path so client never
  // requests the backend domain directly. Importantly, avoid reading
  // `process.env` at module load time so the backend domain is not
  // embedded into the client bundle.
  if (typeof window !== 'undefined') {
    // If already absolute URL, extract pathname + search and proxy it
    if (/^https?:\/\//i.test(pathOrUrl)) {
      try {
        const u = new URL(pathOrUrl)
        return `/api/backend${u.pathname}${u.search}`
      } catch {
        return pathOrUrl
      }
    }

    // If path starts with a slash, proxy directly
    if (pathOrUrl.startsWith('/')) {
      return `/api/backend${pathOrUrl}`
    }

    // Fallback: ensure single slash
    return `/api/backend/${pathOrUrl}`
  }

  // Server-side: read env and return fully qualified backend URL
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (!envBase) return pathOrUrl

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }

  if (pathOrUrl.startsWith('/')) {
    return `${envBase}${pathOrUrl}`
  }

  return `${envBase}/${pathOrUrl}`
}

export default getPublicUrl
