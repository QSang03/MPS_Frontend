/**
 * Utility to remove empty values from an object before sending to server.
 * Removes keys with value `''`, `null`, or `undefined`.
 */
export function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return {}
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    // Treat undefined, null, empty string or whitespace-only string as empty
    if (v === null || v === undefined) continue
    if (typeof v === 'string') {
      if (v.trim() === '') continue
      out[k as keyof T] = v as T[keyof T]
      continue
    }
    // For arrays, treat empty arrays as empty
    if (Array.isArray(v) && v.length === 0) continue
    // For plain objects, treat empty object (no own keys) as empty
    if (typeof v === 'object' && !Array.isArray(v)) {
      try {
        if (Object.keys(v).length === 0) continue
      } catch {
        // ignore and keep value
      }
    }
    out[k as keyof T] = v as T[keyof T]
  }
  return out
}

export default removeEmpty
