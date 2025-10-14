# 🚀 Quick Start - MPS Frontend

## ✅ **Dev Mode ENABLED - Không cần Login!**

---

## 🎯 **Chạy ngay:**

```bash
cd Frontend/mps-frontend
npm run dev
```

**Truy cập:** http://localhost:3000

→ **Tự động vào Dashboard!** (Không cần đăng nhập)

---

## 📱 **Pages có thể test:**

### **Dashboard (Customer Admin):**

```
http://localhost:3000/customer-admin
```

**Features:**

- ✅ KPI Cards (Devices, Requests, Usage)
- ✅ Recent Activity Feed
- ✅ Real-time Stats

### **Device Management:**

```
http://localhost:3000/customer-admin/devices
```

**Features:**

- ✅ Device List với pagination
- ✅ Status badges (Active/Inactive/Error/Maintenance)
- ✅ Add new device
- ✅ View device details (click vào Serial Number)
- ✅ Edit device
- ✅ Delete device

### **Service Requests:**

```
http://localhost:3000/customer-admin/service-requests
```

**Features:**

- ✅ Request List với Status Tabs (All/New/In Progress/Resolved)
- ✅ Create new request
- ✅ Priority badges
- ✅ Action menus

### **Purchase Requests:**

```
http://localhost:3000/customer-admin/purchase-requests
```

**Features:**

- ✅ Request List với Status Tabs
- ✅ Approve/Reject buttons
- ✅ Cost tracking

### **User Management:**

```
http://localhost:3000/customer-admin/users
```

**Features:**

- ✅ User list với role badges
- ✅ Active/Inactive status
- ✅ Last login info
- ✅ Action menus

### **Reports:**

```
http://localhost:3000/customer-admin/reports
```

**Features:**

- ✅ Report Generator (4 types)
- ✅ Report History
- ✅ Download functionality

### **User Pages:**

```
http://localhost:3000/user/my-devices
http://localhost:3000/user/my-requests
http://localhost:3000/user/profile
```

### **System Admin:**

```
http://localhost:3000/system-admin/customers
```

---

## 🎨 **UI Features để Test:**

### **Navigation:**

- ✅ Click Sidebar menu items
- ✅ Responsive (resize browser)
- ✅ Mobile menu (< 1024px)
- ✅ Active route highlighting

### **Tables:**

- ✅ Pagination (prev/next/first/last)
- ✅ Rows per page (10/20/30/40/50)
- ✅ Click row để view details
- ✅ Action menu (3 dots)

### **Forms:**

- ✅ Input validation
- ✅ Error messages
- ✅ Submit buttons
- ✅ Cancel buttons
- ✅ Loading states

### **Modals & Dialogs:**

- ✅ Delete confirmation
- ✅ Cancel/Confirm buttons
- ✅ Backdrop click to close

### **Notifications:**

- ✅ Success toasts (create/update/delete)
- ✅ Error toasts
- ✅ Auto-dismiss

### **Loading States:**

- ✅ Skeleton loaders
- ✅ Spinner buttons
- ✅ Suspense boundaries

---

## 🔧 **Mock Data Available:**

Tất cả data hiện tại là mock - sẽ show:

- Customer: Acme Corporation
- Devices: HP LaserJet models
- Service Requests: Sample requests
- Users: John Doe, Jane Smith, Bob Wilson
- Reports: Monthly reports
- KPIs: Sample statistics

---

## 🎯 **Test Scenarios:**

### **1. Navigation Flow:**

1. Vào Dashboard
2. Click "Devices" trong sidebar
3. Click "Add Device"
4. Fill form → Click Cancel
5. Thử các menu items khác

### **2. CRUD Flow:**

1. Vào Devices
2. Click "Add Device"
3. Fill form với validation errors
4. Fix và submit
5. Click vào device detail
6. Click Edit
7. Update và save

### **3. List & Pagination:**

1. Vào Service Requests
2. Switch giữa các tabs (All/New/In Progress/Resolved)
3. Thử pagination
4. Thay đổi rows per page

### **4. Responsive:**

1. Resize browser < 1024px
2. Click hamburger menu
3. Test mobile navigation
4. Test các pages trên mobile view

---

## 📊 **Browser Console:**

Check console sẽ thấy:

```
✅ WebSocket connected (hoặc error nếu backend chưa có)
✅ React Query cache logs
✅ No errors về authentication
```

---

## ⚠️ **Notes:**

1. **Mock Data:**
   - Tất cả data là hardcoded
   - Create/Edit/Delete sẽ show toast nhưng không persist

2. **API Calls:**
   - Sẽ lỗi vì backend chưa có
   - Có thể bỏ qua errors trong Console
   - UI vẫn hoạt động bình thường

3. **WebSocket:**
   - Sẽ fail to connect (backend chưa có)
   - Không ảnh hưởng UI

---

## 🎉 **Enjoy Testing!**

Tất cả UI/UX đã hoàn chỉnh và sẵn sàng test!

**Server đang chạy tại:** http://localhost:3000
