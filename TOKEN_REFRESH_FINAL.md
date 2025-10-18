# Token Refresh Strategy - Final Implementation

## Tổng quan

Hệ thống xử lý refresh token được thiết kế với 2 luồng riêng biệt:

1. **Server-Side (Page Render)**: Refresh token TRƯỚC KHI render page
2. **Client-Side (User Actions)**: Refresh token TỰ ĐỘNG khi nhận 401

---

## 1. Server-Side Flow (Page Render)

### Vấn đề

- Server Components render trước khi client hydrate
- Không thể dùng interceptor để tự động retry request
- Nếu access token hết hạn → 401 → page không load được

### Giải pháp

Gọi `ensureValidToken()` TRƯỚC KHI gọi bất kỳ API nào:

```tsx
// src/app/(dashboard)/customer-admin/users/page.tsx
export default async function UsersPage() {
  // 1. Check session
  const session = await getSession()
  if (!session) redirect(ROUTES.LOGIN)

  // 2. Ensure valid token (refresh if needed)
  const hasValidToken = await ensureValidToken()
  if (!hasValidToken) redirect(ROUTES.LOGIN)

  // 3. Now safe to call APIs
  const [users, roles, departments] = await Promise.all([...])
}
```

### Chi tiết `ensureValidToken()`

```typescript
// src/lib/auth/ensure-valid-token.ts
export async function ensureValidToken(): Promise<boolean> {
  const accessToken = await getAccessToken()
  const refreshToken = await getRefreshToken()

  // Có access token → OK
  if (accessToken) return true

  // Không có access token nhưng có refresh token → refresh
  if (refreshToken) {
    // Gọi backend POST /auth/refresh
    const response = await axios.post(...)

    if (success) {
      // Cập nhật cookies
      cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {...})
      return true
    }
  }

  // Không có token hoặc refresh thất bại
  return false
}
```

### Luồng xử lý

```
Page Load
    ↓
getSession() → OK?
    ↓ NO
Redirect to /login
    ↓ YES
ensureValidToken()
    ↓
Has access_token?
    ↓ YES
Continue to API calls
    ↓ NO (but has refresh_token)
Call POST /auth/refresh
    ↓
Success?
    ↓ YES
Update cookies → Continue
    ↓ NO
Redirect to /login
```

---

## 2. Client-Side Flow (User Actions)

### Vấn đề

- User đang tương tác với trang (thêm, sửa, xóa)
- Access token hết hạn giữa chừng
- Cần refresh tự động KHÔNG làm gián đoạn UX

### Giải pháp

Dùng axios interceptor trong `client.ts`:

```typescript
// src/lib/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Nhận 401?
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Gọi Route Handler /api/auth/refresh
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
        })

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json()

          // Retry request với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        }
      } catch {
        // Refresh thất bại → xóa cookies → redirect login
        document.cookie = 'mps_session=; expires=...'
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
```

### Luồng xử lý

```
User clicks "Add User"
    ↓
POST /users với access_token
    ↓
Backend trả về 401
    ↓
Interceptor bắt 401
    ↓
POST /api/auth/refresh
    ↓
Success?
    ↓ YES
Update Authorization header
Retry POST /users
    ↓
User sees success
    ↓ NO
Clear cookies
Redirect to /login
```

---

## 3. Route Handler `/api/auth/refresh`

Đây là ĐIỂM DUY NHẤT được phép modify cookies từ client requests:

```typescript
// src/app/api/auth/refresh/route.ts
export async function POST() {
  // 1. Đọc refresh_token từ cookie
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  // 2. Gọi backend API
  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    refreshToken,
  })

  if (response.status !== 200) {
    // Clear cookies nếu thất bại
    cookieStore.delete('refresh_token')
    cookieStore.delete('access_token')
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
  }

  // 3. Cập nhật cookies
  const { accessToken, refreshToken: newRefreshToken } = response.data

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    maxAge: 15 * 60, // 15 phút
  })

  if (newRefreshToken) {
    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    })
  }

  // 4. Trả về access token mới cho client
  return NextResponse.json({ accessToken, success: true })
}
```

---

## 4. Server API Client (Không refresh)

```typescript
// src/lib/api/server-client.ts
serverApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // KHÔNG thử refresh token ở đây nữa
    if (error.response?.status === 401) {
      console.error('❌ Auth failed on server-side request')
      return Promise.reject(new Error('Authentication failed - please login again'))
    }
    return Promise.reject(error)
  }
)
```

**Tại sao không refresh ở server-client?**

- Server Components render trước khi client hydrate
- Không thể modify cookies trong interceptor (Next.js 15 rule)
- Đã xử lý ở `ensureValidToken()` trước khi gọi API

---

## 5. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Page                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Server Component (UsersPage)                   │
│  1. getSession() → Check session exists                     │
│  2. ensureValidToken() → Refresh if needed                  │
│  3. Call APIs (users, roles, etc.)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Page rendered
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  User Interacts (Add/Edit)                  │
│  1. Client component calls API                              │
│  2. If 401 → axios interceptor → POST /api/auth/refresh     │
│  3. Retry with new token                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Cookies được sử dụng

| Cookie Name     | Expiry  | Purpose                         |
| --------------- | ------- | ------------------------------- |
| `mps_session`   | 8 hours | JWT session data (userId, role) |
| `access_token`  | 15 min  | Backend API authentication      |
| `refresh_token` | 7 days  | Renew access_token when expired |

---

## 7. Các file quan trọng

| File                                 | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| `src/lib/auth/ensure-valid-token.ts` | Refresh token trước khi render page      |
| `src/lib/api/client.ts`              | Client-side API client với auto-refresh  |
| `src/lib/api/server-client.ts`       | Server-side API client (không refresh)   |
| `src/app/api/auth/refresh/route.ts`  | Route Handler để refresh token từ client |
| `src/lib/auth/session.ts`            | Session và cookie management             |

---

## 8. Testing

### Test Server-Side Refresh

1. Login vào app
2. Xóa `access_token` cookie (giữ lại `refresh_token`)
3. Refresh trang `/customer-admin/users`
4. **Kết quả**: Trang load bình thường (token được refresh tự động)

### Test Client-Side Refresh

1. Login vào app
2. Mở DevTools → Application → Cookies
3. Xóa `access_token` (giữ lại `refresh_token`)
4. Click "Add User" hoặc bất kỳ action nào
5. **Kết quả**: Action thành công (token được refresh trong background)

### Test Token Hết hạn hoàn toàn

1. Xóa cả `access_token` VÀ `refresh_token`
2. Refresh trang hoặc thực hiện action
3. **Kết quả**: Redirect về `/login`

---

## 9. Ưu điểm của giải pháp

✅ **Tách biệt rõ ràng**: Server-side và Client-side có logic riêng  
✅ **Tuân thủ Next.js 15**: Cookies chỉ được modify trong Route Handler  
✅ **UX mượt mà**: User không bị logout khi token hết hạn  
✅ **Dễ debug**: Mỗi luồng có logging riêng  
✅ **An toàn**: HttpOnly cookies, không expose token ra client

---

## 10. Troubleshooting

### Lỗi: "Authentication failed on server-side request"

**Nguyên nhân**: `ensureValidToken()` không được gọi trước API calls  
**Giải pháp**: Thêm check ở đầu Server Component:

```tsx
const hasValidToken = await ensureValidToken()
if (!hasValidToken) redirect(ROUTES.LOGIN)
```

### Lỗi: "Failed to parse URL from /api/auth/refresh"

**Nguyên nhân**: Đang cố gọi relative URL từ server-side  
**Giải pháp**: Đã fix - giờ client gọi `/api/auth/refresh`, server gọi trực tiếp backend

### Lỗi: Redirect loop /login

**Nguyên nhân**: Refresh token cũng hết hạn hoặc không hợp lệ  
**Giải pháp**: User cần login lại (đây là hành vi đúng)

---

**Tác giả**: GitHub Copilot  
**Ngày cập nhật**: October 17, 2025  
**Version**: 2.0 (Final Architecture)
