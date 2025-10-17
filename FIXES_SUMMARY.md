# Tóm tắt các Fix - MPS Frontend

## Ngày: 16/10/2025

### ✅ 1. Fix Login & Cookies Issue

**Vấn đề**: Access token và refresh token không được lưu vào cookies sau khi login

**Nguyên nhân**:

- API response có cấu trúc `{ success: true, data: { user, accessToken, refreshToken } }`
- Code đang lấy trực tiếp từ `response.data` thay vì `response.data.data`
- Mapping `customerId` sai - lấy từ `attributes.customField` thay vì `user.customerId`

**Fix**:

1. **Cập nhật `AuthResponse` type** (`src/types/auth.ts`):

   ```typescript
   export interface AuthResponse {
     success: boolean
     data: {
       user: AuthUser
       accessToken: string
       refreshToken: string
     }
   }
   ```

2. **Fix login action** (`src/app/actions/auth.ts`):

   ```typescript
   const response = await serverApiClient.post<AuthResponse>(...)
   const { data } = response.data  // Extract nested data

   await createSessionWithTokens({
     session: {
       userId: data.user.id,
       customerId: data.user.customerId,  // ✅ Fix: từ user.customerId
       // ...
     },
     accessToken: data.accessToken,
     refreshToken: data.refreshToken,
   })
   ```

3. **Thêm logging** để debug:
   - Log khi nhận tokens
   - Log khi tạo cookies
   - Xác nhận cookies được set thành công

**Kết quả**: ✅ Cookies được lưu thành công với httpOnly, secure, sameSite

---

### ✅ 2. Fix API Response Format - Users, Roles, Departments

**Vấn đề**: API responses trả về format `{ success, data: { ... } }` nhưng code expect format flat

**Fix**:

#### 2.1. Users Service

**API Response**:

```json
{
  "success": true,
  "data": [User[]],           // ← array of users
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 8
  },
  "message": "Users retrieved successfully"
}
```

**Updated `UsersResponse` type**:

```typescript
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UsersResponse {
  success: boolean
  data: User[] // ✅ data is array
  pagination: Pagination // ✅ separate pagination
  message?: string
}
```

**Updated service**:

```typescript
const response = await serverApiClient.get<UsersResponse>(url)
return response.data // Returns { success, data: User[], pagination }
```

#### 2.2. Roles Service

```typescript
// API: { success, data: { roles: [] } }
const response = await serverApiClient.get<{ success: boolean; data: { roles: UserRole[] } }>(
  '/roles'
)
return response.data.data?.roles || []
```

#### 2.3. Departments Service

```typescript
// API: { success, data: { departments: [] } }
const response = await serverApiClient.get<{
  success: boolean
  data: { departments: Department[] }
}>('/departments')
return response.data.data?.departments || []
```

#### 2.4. Customer Service

```typescript
// Handle multiple formats: { success, data: { customers } } or { customers } or [...]
const response = await serverApiClient.get<...>(API_ENDPOINTS.CUSTOMERS)
const data = response.data

// Try different formats
if ('data' in data && data.data && 'customers' in data.data) {
  return data.data.customers
}
if ('customers' in data) {
  return data.customers
}
if (Array.isArray(data)) {
  return data
}
return []
```

---

### ✅ 3. Fix Users Table Pagination

**Vấn đề**:

- `initialUsers` undefined causing `Cannot read properties of undefined (reading 'length')`
- Client-side pagination conflicts with server-side pagination

**Fix**:

1. **Add `initialPagination` prop** to UsersTable:

   ```typescript
   interface UsersTableProps {
     initialUsers: User[]
     initialPagination?: {
       page: number
       limit: number
       total: number
       totalPages: number
     }
     // ...
   }
   ```

2. **Update UsersPage** to pass pagination:

   ```typescript
   const usersResponse = await usersService.getUsers(...)

   <UsersTable
     initialUsers={usersResponse?.data || []}
     initialPagination={usersResponse?.pagination}
     // ...
   />
   ```

3. **Sync pagination state** with server response:

   ```typescript
   const [pagination, setPagination] = useState<UserPagination>(() => {
     if (initialPagination) {
       return { ...initialPagination }
     }
     return { page: 1, limit: 10, total: 0, totalPages: 1 }
   })
   ```

4. **Update pagination display**:
   ```typescript
   Hiển thị {currentPageUsers.length} trong tổng số {pagination.total} người dùng
   Trang {pagination.page} / {pagination.totalPages}
   ```

---

### ✅ 4. Add Fallback Values

**Tất cả các props đều có fallback để tránh undefined errors**:

```typescript
<UsersTable
  initialUsers={usersResponse?.data || []}
  initialPagination={usersResponse?.pagination}
  roles={roles?.map((r) => ({ id: r.id, name: r.name })) || []}
  departments={departments?.map((d) => ({ id: d.id, name: d.name })) || []}
  customers={customers || []}
/>
```

---

### ✅ 5. Fix Refresh Token API Call - Use Server-side Axios

**Vấn đề**: `refreshAccessToken()` đang dùng `fetch()` (client-side approach) thay vì server-side axios

**Tại sao cần fix**:

- Không consistent với các API calls khác (users, roles, departments đều dùng serverApiClient)
- `fetch()` không có retry logic hoặc interceptors
- Server-side code nên dùng server-side tools

**Fix**:

```typescript
// Import axios
import axios from 'axios'

// Use axios.post instead of fetch
const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
  { refreshToken },
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    validateStatus: (status) => status < 500, // Don't throw on 4xx
  }
)

// Access data from response.data (axios format)
const responseData = response.data
```

**Lưu ý**: Không thể dùng `serverApiClient` vì sẽ gây circular dependency:

- `serverApiClient` import `refreshAccessToken` từ `session.ts`
- Nếu `session.ts` import `serverApiClient` → circular dependency
- Giải pháp: Dùng `axios` trực tiếp trong `refreshAccessToken()`

---

## Testing Checklist

- [x] Login với credentials hợp lệ
- [x] Kiểm tra cookies được set (access_token, refresh_token, mps_session)
- [x] Navigate đến `/customer-admin/users`
- [x] Xem danh sách users với pagination
- [x] Chuyển trang (Previous/Next)
- [x] Kiểm tra filter by role, department, customer
- [x] Kiểm tra search functionality
- [ ] Test token refresh khi access token hết hạn
- [ ] Test auto-refresh khi gọi API với expired token

---

## Debug URLs

- Login: `http://localhost:3000/login`
- Users: `http://localhost:3000/customer-admin/users`
- Auth Status Debug: `http://localhost:3000/debug/auth-status`
- Token Refresh Test: `http://localhost:3000/debug/token-refresh`

---

## Logs để kiểm tra

### Login Success:

```
✅ Login successful - User: admin@example.com
✅ Access token received: Yes
✅ Refresh token received: Yes
🔒 Creating session with tokens...
✅ Session cookie set: mps_session
✅ Access token cookie set: access_token
✅ Refresh token cookie set: refresh_token
🎉 All cookies created successfully!
```

### Users Loaded:

```
✅ Users loaded: { count: 2, page: 1, total: 15 }
📊 Users data received: { usersCount: 2, page: 1, total: 15, ... }
```

---

## Files Modified

### Types:

- `src/types/auth.ts` - Added `AuthUser` interface, updated `AuthResponse`
- `src/types/users.ts` - Added `Pagination` interface, updated `UsersResponse`

### Services:

- `src/lib/api/services/users.service.ts` - Handle new response format
- `src/lib/api/services/roles.service.ts` - Handle nested data response
- `src/lib/api/services/departments.service.ts` - Handle nested data response
- `src/lib/api/services/customer.service.ts` - Handle multiple formats
- `src/lib/api/services/auth.service.ts` - Handle nested data response

### Actions:

- `src/app/actions/auth.ts` - Fix token extraction and customerId mapping

### Auth:

- `src/lib/auth/session.ts` - Add logging for cookie creation

### Components:

- `src/app/(dashboard)/customer-admin/users/page.tsx` - Use new response format
- `src/app/(dashboard)/customer-admin/users/_components/UsersTable.tsx` - Support server pagination

### Debug:

- `src/app/debug/auth-status/page.tsx` - New debug page for auth status

---

## Notes

1. **Server-side pagination**: Users API bây giờ handle pagination ở server, client chỉ hiển thị
2. **Consistent API format**: Tất cả API services giờ handle format `{ success, data: {...} }`
3. **Fallback values**: Tránh undefined errors bằng cách dùng `|| []` cho arrays
4. **Logging**: Thêm console.log để debug dễ dàng (có thể remove trong production)

---

## API Response Formats Summary

| Endpoint       | Response Format                                          |
| -------------- | -------------------------------------------------------- |
| `/auth/signin` | `{ success, data: { user, accessToken, refreshToken } }` |
| `/users`       | `{ success, data: User[], pagination, message }`         |
| `/roles`       | `{ success, data: { roles: [] } }`                       |
| `/departments` | `{ success, data: { departments: [] } }`                 |
| `/customers`   | `{ success, data: { customers: [] } }` (hoặc variations) |
