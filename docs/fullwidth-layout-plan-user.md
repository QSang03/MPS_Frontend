# Full-width Layout Plan — User Pages

Goal: Make user-facing pages use the full available content width where appropriate so dashboards, tables and filters make better use of screen space.

Summary

- Apply `fullWidth` to pages under `src/app/(dashboard)/user` where it improves layout for wide tables, charts, or lists.
- Audit inner wrappers for `mx-auto`, `container`, or `max-w-*` and remove/adjust page-level constraints while preserving decorative/modals sizing.

Approach (per page)

1. Replace `<SystemPageLayout>` with `<SystemPageLayout fullWidth>` (or set `fullWidth` via prop) on the page entry file.
2. Run dev server and spot-check the page at desktop/tablet/mobile sizes.
3. Fix any inner `mx-auto` / `max-w-*` page-level wrappers that still constrain main content.
4. Keep per-cell `max-w-[...]` for table column constraints and keep modal `maxWidth` overrides.
5. Update this checklist and the repo TODO list as pages are completed.

Priority

- High: pages with wide tables or charts (Dashboard, Devices, Warehouse Docs, My Requests, Contracts, Consumables, Users)
- Medium: Pages with forms or small lists (Profile, Settings)
- Low: Deep detail pages (individual ids) — still convert if they render large content.

Checklist — User pages (initial)

- [x] Dashboard — `src/app/(dashboard)/user/dashboard/page.tsx`
- [x] Dashboard (client hero) — `src/app/(dashboard)/user/dashboard/_components/DashboardPageClient.tsx`
- [x] Devices — `src/app/(dashboard)/user/devices/page.tsx`
- [x] Device Detail — `src/app/(dashboard)/user/devices/[id]/page.tsx`
- [x] My Requests — `src/app/(dashboard)/user/my-requests/page.tsx`
- [x] My Request Detail — `src/app/(dashboard)/user/my-requests/[id]/page.tsx`
- [x] Service Request Detail (public) — `src/app/(dashboard)/user/service-requests/[id]/page.tsx`
- [x] Warehouse Documents — `src/app/(dashboard)/user/warehouse-documents/page.tsx`
- [x] Warehouse Document New — `src/app/(dashboard)/user/warehouse-documents/new/page.tsx`
- [x] Warehouse Document Detail — `src/app/(dashboard)/user/warehouse-documents/[id]/page.tsx`
- [x] Contracts — `src/app/(dashboard)/user/contracts/page.tsx`
- [x] Contract Detail — `src/app/(dashboard)/user/contracts/[id]/page.tsx`
- [x] Consumables — `src/app/(dashboard)/user/consumables/page.tsx`
- [x] Users (user-facing list) — `src/app/(dashboard)/user/users/page.tsx`
- [x] Profile — `src/app/(dashboard)/user/profile/page.tsx`
- [x] Settings — `src/app/(dashboard)/user/settings/page.tsx`
- [x] Departments — `src/app/(dashboard)/user/departments/page.tsx`
- [x] Monthly Costs — `src/app/(dashboard)/user/dashboard/costs/monthly/page.tsx`

Notes

Progress: Created `src/components/user/UserPageLayout.tsx` and converted multiple user pages to use it. Converted pages:

- `dashboard/page.tsx` and `dashboard/_components/DashboardPageClient.tsx`
- `devices/page.tsx`
- `consumables/page.tsx`
- `warehouse-documents/page.tsx` and `warehouse-documents/new/page.tsx`
- `warehouse-documents/[id]/` client component updated to full width
- `my-requests/page.tsx` and `my-requests/[id]` client updated to full width
- `service-requests/[id]/page.tsx` (user-facing) updated to full width
- `users/page.tsx`
- `dashboard/costs/monthly/page.tsx`

All user entry pages and the common detail pages have been converted to use `UserPageLayout`. Next steps: run `npm run type-check` and `npm run lint` locally, perform visual QA across breakpoints, and open a PR if you want this batched.
