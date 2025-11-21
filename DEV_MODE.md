# 🔧 Development Mode - Bypass Login

## Cách sử dụng Development Mode

### **Bật Dev Mode (Bypass Login):**

File `.env.local` hoặc `.env.development`:

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

### **Tắt Dev Mode (Cần Login):**

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
# hoặc xóa dòng này
```

---

## 🎯 **Dev Mode Features**

Khi `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`:

1. ✅ **Tự động skip login page**
   - Truy cập `/login` → Auto redirect to dashboard
   - Truy cập `/` → Auto redirect to dashboard

2. ✅ **Mock session tự động**
   - User: Dev User
   - Role: CustomerAdmin
   - Customer ID: customer-1
   - Email: dev@test.com

3. ✅ **Test tất cả features:**
   - Dashboard
   - Devices
   - Service Requests
   - Purchase Requests
   - Users
   - Reports

---

## 🚀 **Cách Test:**

### **1. Bật Dev Mode:**

```bash
# Trong .env.local
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

### **2. Chạy dev server:**

```bash
npm run dev
```

### **3. Truy cập:**

```
http://localhost:3000
→ Auto redirect to: /customer-admin
```

### **4. Test các modules:**

- ✅ Dashboard: http://localhost:3000/customer-admin
- ✅ Devices: http://localhost:3000/customer-admin/devices
- ✅ Service Requests: http://localhost:3000/customer-admin/service-requests
- ✅ Purchase Requests: http://localhost:3000/customer-admin/purchase-requests
- ✅ Users: http://localhost:3000/customer-admin/users
- ✅ Reports: http://localhost:3000/customer-admin/reports

---

## 🔄 **Đổi Role trong Dev Mode**

Để test với role khác, edit `src/middleware.ts`:

```typescript
// Đổi role mock session:
const mockSession: Session = {
  userId: 'dev-user-1',
  customerId: 'customer-1',
  role: UserRole.SYSTEM_ADMIN, // ← Đổi role ở đây
  username: 'Dev User',
  email: 'dev@test.com',
}
```

**Available roles:**

- `UserRole.SYSTEM_ADMIN` → `/system-admin/customers`
- `UserRole.CUSTOMER_ADMIN` → `/customer-admin`
- `UserRole.USER` → `/user/my-devices`

---

## ⚠️ **Important Notes**

1. **Chỉ dùng trong Development:**
   - Dev mode CHỈ hoạt động khi `NODE_ENV=development`
   - Production sẽ tự động tắt bypass

````markdown
# 🔧 Development Mode - Bypass Login

## Cách sử dụng Development Mode

### **Bật Dev Mode (Bypass Login):**

File `.env.local` hoặc `.env.development`:

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```
````

### **Tắt Dev Mode (Cần Login):**

```bash
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
# hoặc xóa dòng này
```

---

## 🎯 **Dev Mode Features**

Khi `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`:

1. ✅ **Tự động skip login page**
   - Truy cập `/login` → Auto redirect to dashboard
   - Truy cập `/` → Auto redirect to dashboard

2. ✅ **Mock session tự động**
   - User: Dev User
   - Role: CustomerAdmin
   - Customer ID: customer-1
   - Email: dev@test.com

3. ✅ **Test tất cả features:**
   - Dashboard
   - Devices
   - Service Requests
   - Purchase Requests
   - Users
   - Reports

---

## 🚀 **Cách Test:**

### **1. Bật Dev Mode:**

```bash
# Trong .env.local
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
```

### **2. Chạy dev server:**

```bash
npm run dev
```

### **3. Truy cập:**

```
http://localhost:3000
→ Auto redirect to: /customer-admin
```

### **4. Test các modules:**

- ✅ Dashboard: http://localhost:3000/customer-admin
- ✅ Devices: http://localhost:3000/customer-admin/devices
- ✅ Service Requests: http://localhost:3000/customer-admin/service-requests
- ✅ Purchase Requests: http://localhost:3000/customer-admin/purchase-requests
- ✅ Users: http://localhost:3000/customer-admin/users
- ✅ Reports: http://localhost:3000/customer-admin/reports

---

## 🔄 **Đổi Role trong Dev Mode**

Để test với role khác, edit `src/middleware.ts`:

```typescript
// Đổi role mock session:
const mockSession: Session = {
  userId: 'dev-user-1',
  customerId: 'customer-1',
  role: UserRole.SYSTEM_ADMIN, // ← Đổi role ở đây
  username: 'Dev User',
  email: 'dev@test.com',
}
```

**Available roles:**

- `UserRole.SYSTEM_ADMIN` → `/system-admin/customers`
- `UserRole.CUSTOMER_ADMIN` → `/customer-admin`
- `UserRole.USER` → `/user/my-devices`

---

## ⚠️ **Important Notes**

1. **Chỉ dùng trong Development:**
   - Dev mode CHỈ hoạt động khi `NODE_ENV=development`
   - Production sẽ tự động tắt bypass

2. **Backend API vẫn cần:**
   - Dev mode chỉ bypass authentication
   - Data fetching vẫn cần backend API (hoặc sẽ lỗi)
   - Hiện tại đang dùng mock data trong components

3. **Tắt khi test Login:**
   - Để test login flow thật, set `NEXT_PUBLIC_DEV_BYPASS_AUTH=false`

---

## 🎨 **Mock Data Available**

Các trang đang dùng mock data:

- ✅ Customer list/detail
- ✅ Device list/detail
- ✅ Service requests
- ✅ Purchase requests
- ✅ Users
- ✅ Reports
- ✅ Dashboard KPIs
- ✅ Recent Activity

---

## 🔥 **Quick Start (No Backend):**

```bash
# 1. Ensure dev bypass is ON
# Check .env.local has: NEXT_PUBLIC_DEV_BYPASS_AUTH=true

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:3000
# → Tự động vào dashboard với mock data

# 4. Test tất cả features
# Không cần login!
```

---

**Happy Testing! 🚀**

---

## 🧩 Phase 1 UI/UX Standardization (Nov 2025)

### Status & Priority Badges

- Use `StatusBadge` component: `<StatusBadge serviceStatus={status} />` or `<StatusBadge priority={priority} />`.
- Vietnamese labels (Title Case): Trạng thái = "Mở", "Đang xử lý", "Đã xử lý", "Đóng"; Ưu tiên = "Cao", "Bình thường", "Thấp", "Khẩn cấp".
- Style: `text-[12px] font-semibold px-3 py-1.5 rounded-[20px]` with soft background & subtle border.

### Header Banner (`PageHeader`)

- Title size 32px bold; gradient blue→cyan.
- Icon box: 40px white background, subtle ring.
- Padding: `px-8 py-6`, border radius: `rounded-2xl`.
- Optional stats subtitle format: `Quản lý X yêu cầu (Y đang xử lý, Z đã xử lý)`.

### Filter Section (`FilterSection`)

- Background `#F9FAFB`, padding 16px, gap 12px between controls.
- Inputs/selects target height 40px, radius 8px (handled via UI components).

### Buttons (`button.tsx`)

- Primary: `bg-blue-600 text-white hover:bg-blue-700` (200ms transition).
- Secondary/Outline: border blue-600, text blue-600, hover `bg-blue-50`.
- Default size height 40px (`h-10`), font weight 600.

### Constants

- Mappings in `src/constants/status.ts`: `SERVICE_REQUEST_STATUS_DISPLAY`, `PRIORITY_DISPLAY`.
- Remove ad-hoc label objects when refactoring pages.

### Migration Checklist

1. Replace legacy badge markup with `StatusBadge`.
2. Ensure header uses `PageHeader` updated styles.
3. Normalize buttons to `variant="default"` or `variant="outline"`.
4. Wrap filter controls with `FilterSection` for consistent look.
5. Remove duplicated status/priority config objects.

### Completed Items

- Unified badge component & mappings
- Header banner styling
- Filter section base style
- Button variants standardized
- Inline stats text added to user requests page

---

## 🧩 Phase 2 Improvements (Nov 2025)

Goal: Improve layout-specific UX for Admin and User views without breaking existing data flows. Focus areas: Admin tables, User card lists, and Tabs.

1. Admin Table Improvements

- Standardize status labels using `SERVICE_REQUEST_STATUS_DISPLAY` and render with `StatusBadge`.
- Replace relative timestamps with absolute `formatDateTime(...)` in table cells; keep relative time for lightweight lists (configurable later).
- Add row hover effect `bg-gray-50` and subtle elevation (`hover:shadow-md` where applicable).
- Add header icons + tooltips for important columns (ID, Phản hồi, Giải quyết, Trạng thái, Ưu tiên).
- Provide a status filter dropdown and ensure table `Select` uses `StatusBadge` inside trigger for consistent styling.
- Migration hints:
  - Replace ad-hoc badge strings in tables with `<StatusBadge serviceStatus={row.status} />` or `<StatusBadge priority={row.priority} />`.
  - Centralize any color/border styles in `STATUS_CARD_STYLE` or constants to avoid duplication.

2. User Card List Improvements

- Add inline header stats in user page headers (e.g., `Quản lý X yêu cầu (Y đang xử lý, Z đã xử lý)`).
- Expand card content to show device name and customer name when available.
- Add multi-select mode with checkboxes for batch actions; show bulk action bar when active.
- Increase card spacing and shadow on hover (`hover:shadow-lg`) for clearer separation.

3. Tabs (Admin)

- Add icons next to tab labels and a small count badge (uses quick query with `limit=1` to obtain `pagination.total`).
- Active tab: underline `3px` blue (`data-[state=active]:border-b-4 data-[state=active]:border-b-blue-600`).
- Hover state: `bg-gray-100` for tab triggers.

4. Implementation Notes & Files Changed

- `src/app/(dashboard)/system/requests/page.tsx` — tabs with icons + quick counts.
- `src/components/ui/tabs.tsx` — tab trigger hover + active underline styles.
- `src/app/(dashboard)/system/requests/_components/ServiceRequestsTable.tsx` — header icons/tooltips, absolute timestamps, `StatusBadge` usage.
- `src/app/(dashboard)/user/my-requests/_components/MyRequestsPageClient.tsx` — card expansions with device/customer, selection mode improvements.

5. Next steps (Phase 2 remaining)

- Add admin tab counts for SLA if API supports it (or add server endpoint to provide stats).
- Optionally add a toggle to switch between relative/absolute timestamps per user preference.
- Run visual QA across system pages (desktop + mobile breakpoints).

---
