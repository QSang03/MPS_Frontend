// Utility to determine if A4 columns or standard columns should be shown.
// The function centralizes logic used in multiple components for consistency.
export type ShowMode = 'a4' | 'standard' | 'both'

export function getShowModeFromDeviceAndItems(
  showA4Prop: boolean | 'auto' | undefined,
  deviceModelFlag: unknown,
  items?: Array<Record<string, unknown>>
): ShowMode {
  // Normalize explicit `showA4` prop values
  if (showA4Prop === true) return 'a4'
  if (showA4Prop === false) return 'standard'

  // If device model flag present, use it
  const raw = deviceModelFlag as unknown
  const modelUseA4 = raw === true || raw === 'true' || raw === 1 || raw === '1'
  if (typeof raw !== 'undefined') {
    return modelUseA4 ? 'a4' : 'standard'
  }

  // Fallback: auto-detect from item rows when no device model available
  const rows = Array.isArray(items) ? items : []
  const hasStandard = rows.some(
    (r) =>
      (r['totalPages'] as unknown) != null ||
      (r['totalPageCount'] as unknown) != null ||
      (r['totalColorPages'] as unknown) != null ||
      (r['totalBlackWhitePages'] as unknown) != null
  )
  const hasA4 = rows.some(
    (r) =>
      (r['totalPagesA4'] as unknown) != null ||
      (r['totalPageCountA4'] as unknown) != null ||
      (r['totalColorPagesA4'] as unknown) != null ||
      (r['totalBlackWhitePagesA4'] as unknown) != null
  )
  if (hasA4 && !hasStandard) return 'a4'
  if (!hasA4 && hasStandard) return 'standard'
  if (hasA4 && hasStandard) return 'a4' // prefer A4 when both present
  return 'both'
}

export default getShowModeFromDeviceAndItems
