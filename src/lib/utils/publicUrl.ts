export function getPublicUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null

  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (!envBase) return pathOrUrl

  // If already absolute URL, replace origin with env base
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      return pathOrUrl.replace(/^https?:\/\/[^\/]+/, envBase)
    } catch {
      return pathOrUrl
    }
  }

  // If path starts with a slash, join directly
  if (pathOrUrl.startsWith('/')) {
    return `${envBase}${pathOrUrl}`
  }

  // Fallback: ensure single slash
  return `${envBase}/${pathOrUrl}`
}

export default getPublicUrl
