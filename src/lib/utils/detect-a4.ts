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
  // NOTE: With the new backend logic, when model does NOT use A4 counters we still
  // want to show both standard + A4 columns. Therefore, `showA4=false` should not
  // force "standard only"; treat it like auto/undefined.

  // If device model flag present, use it
  const raw = deviceModelFlag as unknown
  const modelUseA4 = raw === true || raw === 'true' || raw === 1 || raw === '1'
  if (typeof raw !== 'undefined') {
    // New backend logic:
    // - If model uses A4 counters: show A4 only
    // - If model does NOT use A4 counters: show BOTH standard + A4 (agent updates standard; billing/statistics use A4)
    return modelUseA4 ? 'a4' : 'both'
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
  if (hasA4 && hasStandard) return 'both'
  return 'both'
}

export default getShowModeFromDeviceAndItems
