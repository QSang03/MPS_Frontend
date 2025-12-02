# Full-width Layout Plan

Goal: Make the system pages use the full available content width where appropriate so tables, dashboards and filters make better use of screen space.

Summary

- Current: Most pages use `SystemPageLayout` which by default uses Tailwind's `container mx-auto` (max-width). This causes wide tables to appear centered with large whitespace.
- Plan: Introduce `fullWidth` option on `SystemPageLayout` (already added) and adopt it for pages that need edge-to-edge content. Where needed, adjust paddings and inner containers.

Pages / Features to update (initial scan)

- System Requests (service requests) — UPDATED
- Dashboard (user) — `src/app/(dashboard)/user/dashboard/_components/DashboardPageClient.tsx`
- Customers — `src/app/(dashboard)/system/customers/page.tsx`
- Warehouse Documents — `src/app/(dashboard)/system/warehouse-documents/page.tsx`
- Users — `src/app/(dashboard)/system/users/page.tsx`
- Roles — `src/app/(dashboard)/system/roles/page.tsx`
- Revenue / Reports — `src/app/(dashboard)/system/revenue/page.tsx`, `src/app/(dashboard)/system/reports/page.tsx`
- Devices & Device Models — `src/app/(dashboard)/system/devices/page.tsx`, `src/app/(dashboard)/system/device-models/page.tsx`
- Policies / SLA pages — `src/app/(dashboard)/system/policies/page.tsx`, `src/app/(dashboard)/system/slas/page.tsx`, `src/app/(dashboard)/system/sla-templates/page.tsx`
- Departments — `src/app/(dashboard)/system/departments/page.tsx`
- Consumables & Types — `src/app/(dashboard)/system/consumables/page.tsx`, `src/app/(dashboard)/system/consumable-types/page.tsx`
- System Settings — `src/app/(dashboard)/system/system-settings/page.tsx`
- Notifications — `src/app/(dashboard)/system/notifications/page.tsx`

Also review/debug pages with explicit `container mx-auto` (examples in `src/app/debug/*`) and other ad-hoc container usages.

Approach / Implementation steps (per page)

1. Replace `<SystemPageLayout>` with `<SystemPageLayout fullWidth>` (or set `fullWidth` via prop).
2. Run dev server and open the page. Verify the main content uses the wider layout.
3. If spacing is too wide, adjust `p-6` (padding) or add an inner container for non-table elements. Prefer to leave padding but reduce if requested.
4. Check child components that use `container mx-auto` and convert them to flex/w-full or remove the container.
5. Test responsive state (desktop / tablet / mobile) and ensure no horizontal overflow.
6. Add ARIA or keyboard adjustments if any new interactive element is impacted.

Priority

- High: Pages that contain wide tables (Requests, Devices, Users, Warehouse Documents, Customers, Reports).
- Medium: Dashboards & summary pages.
- Low: Small forms or pages where container is fine.

Progress tracking

- Each page has a checkbox below. As I complete changes, I'll update this file and the repo TODO list.

Checklist

- [x] System Requests — `src/app/(dashboard)/system/requests/page.tsx`
- [x] Dashboard (user) — `src/app/(dashboard)/user/dashboard/_components/DashboardPageClient.tsx`
- [x] Customers — `src/app/(dashboard)/system/customers/page.tsx`
- [x] Warehouse Documents — `src/app/(dashboard)/system/warehouse-documents/page.tsx`
- [x] Users — `src/app/(dashboard)/system/users/page.tsx`
- [x] Roles — `src/app/(dashboard)/system/roles/page.tsx`
- [x] Revenue — `src/app/(dashboard)/system/revenue/page.tsx`
- [x] Reports — `src/app/(dashboard)/system/reports/page.tsx`
- [x] Devices — `src/app/(dashboard)/system/devices/page.tsx`
- [x] Device Models — `src/app/(dashboard)/system/device-models/page.tsx`
- [x] Policies — `src/app/(dashboard)/system/policies/page.tsx`
- [x] SLAs — `src/app/(dashboard)/system/slas/page.tsx`
- [ ] SLA templates — `src/app/(dashboard)/system/sla-templates/page.tsx`
- [x] Departments — `src/app/(dashboard)/system/departments/page.tsx`
- [x] Consumables — `src/app/(dashboard)/system/consumables/page.tsx`
- [ ] Consumable Types — `src/app/(dashboard)/system/consumable-types/page.tsx`
- [x] System Settings — `src/app/(dashboard)/system/system-settings/page.tsx`
- [x] Notifications — `src/app/(dashboard)/system/notifications/page.tsx`
- [ ] Debug pages with `container mx-auto`

Findings (scan for `mx-auto` / `container` / `max-w-` inside `src/app/(dashboard)/system`):

- `src/app/(dashboard)/system/_components/TopCustomersTable.tsx`: uses `mx-auto` on an icon element (harmless)
- `src/app/(dashboard)/system/warehouse-documents/_components/WarehouseDocumentDetailClient.tsx`: contains `mx-auto max-w-screen-2xl` on a wrapper — this explicitly constrains width and should be adjusted if the page is fullWidth
- `src/app/(dashboard)/system/warehouse-documents/_components/WarehouseDocumentDetailClient.tsx`: `max-w-[200px]` used on a table cell (fine)
- `src/app/(dashboard)/system/_components/MonthlySeriesChart.tsx`: charts use `ResponsiveContainer` (keeps 100% width)
- `src/app/(dashboard)/system/_components/CustomerDetailsModal.tsx`: uses `maxWidth="!max-w-[80vw]"` for modal sizing (likely OK)
- `src/app/(dashboard)/system/_components/ContractsModal.tsx` and `ContractDetailModal.tsx`: modals with `maxWidth` overrides (OK to keep)
- `src/app/(dashboard)/system/_components/AlertsSummary.tsx`: `mx-auto` icon centered (harmless)
- `src/app/(dashboard)/system/departments/_components/DepartmentFormModal.tsx`: `maxWidth` for modal (OK)
- `src/app/(dashboard)/system/requests/_components/ServiceRequestsTable.tsx`: several `max-w-[...]` wrappers for compact columns/cells — keep for individual cell sizing
- `src/app/(dashboard)/system/requests/_components/PurchaseRequestsTable.tsx`: similar `max-w` usage for column sizing
- `src/app/(dashboard)/system/users/_components/UserFormModal.tsx`: modal `maxWidth` override (OK)
- `src/app/(dashboard)/system/system-settings/page.tsx`: small icon uses `mx-auto` (harmless)

Recommendations based on scan:

- Convert pages to `fullWidth` (already done for many). After that, audit page-level wrappers for any `mx-auto max-w-...` and change only where it constrains the main table. For example, replace a `mx-auto max-w-screen-2xl` wrapper with a plain `w-full` or remove it.
- Keep localized `max-w` and `mx-auto` uses that are purely decorative (icons, centered headings). Leave modal `maxWidth` overrides alone.
- For tables that still need column max-widths, retain `max-w-[...]` on the cell-level elements — these don't conflict with full page width.

Next steps taken now

- Converted a set of high-priority pages to `fullWidth` and updated the repo TODO list.
- Performed a grep for width-constraining classes and listed findings above.

Suggested follow-up actions (I can do these):

1. Patch specific page-level wrappers that still use `mx-auto max-w-*` (I can open and edit the few flagged files, e.g. `WarehouseDocumentDetailClient.tsx`).
2. Run the dev server locally and spot-check pages at common breakpoints (desktop/tablet/mobile). I can provide a list of pages that need spacing tweaks.
3. Open a PR that groups these layout changes and includes the checklist in this doc for reviewers.

If you'd like, I will now patch the `WarehouseDocumentDetailClient.tsx` wrapper to remove `mx-auto max-w-screen-2xl` and replace it with a responsive `w-full` container so the page truly uses the full width. Proceed?

Verification checklist (for each page)

- [ ] Table expands to page width
- [ ] Filters area aligns well with table width
- [ ] No horizontal scroll appears unintentionally
- [ ] Mobile layout still usable

Notes

- `SystemPageLayout` was updated to accept `fullWidth`. We should prefer using that prop to keep a single component to change behavior centrally.
- If you prefer different spacing rules per page (e.g., full-width table but centered filters), we can implement a thin inner container that only wraps non-table elements.

Next actions (pickable)

- I will continue and convert the top-priority pages to `fullWidth` (Devices, Users, Customers, Warehouse Documents). Confirm and I'll start with `Dashboard` and `Customers`.
- Or I can create a single PR with all page changes.
