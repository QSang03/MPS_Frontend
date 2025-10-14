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
