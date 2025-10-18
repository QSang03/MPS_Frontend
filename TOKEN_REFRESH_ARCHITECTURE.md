# Token Refresh Architecture - Next.js 15 Compatible

## 🎯 Vấn đề

Next.js 15 App Router yêu cầu **CHỈ có thể modify cookies trong Server Actions hoặc Route Handlers**.

Trước đây, `refreshAccessToken()` trong `session.ts` cố gắng modify cookies trực tiếp → **LỖI** khi được gọi từ axios interceptor.

## ✅ Giải pháp

### Kiến trúc mới (3-tier):

```
┌─────────────────────────────────────────────────────────────┐
│  1. Axios Interceptor (server-client.ts / client.ts)       │
│     - Bắt 401 response                                       │
│     - Gọi refreshAccessToken()                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Session Manager (session.ts)                            │
│     - refreshAccessToken() - wrapper với singleton          │
│     - doRefreshToken() - gọi Route Handler                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Route Handler (/api/auth/refresh/route.ts)             │
│     - Nhận request từ internal call                         │
│     - Gọi backend API POST /auth/refresh                    │
│     - UPDATE COOKIES (Next.js 15 compliant)                 │
│     - Trả về accessToken mới                                │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Chi tiết Implementation

### 1. Route Handler: `/api/auth/refresh/route.ts`

**MỤC ĐÍCH:** Nơi DUY NHẤT được phép modify cookies

```typescript
export async function POST(request: NextRequest) {
  // 1. Lấy refresh token từ cookies
  const refreshToken = cookieStore.get('refresh_token')?.value

  // 2. Gọi backend API
  const response = await axios.post('/auth/refresh', { refreshToken })

  // 3. UPDATE COOKIES (✅ Hợp lệ vì đây là Route Handler)
  cookieStore.set('access_token', newAccessToken, { ... })
  cookieStore.set('refresh_token', newRefreshToken, { ... })

  // 4. Trả về token mới
  return NextResponse.json({ accessToken: newAccessToken })
}
```

### 2. Session Manager: `session.ts`

**Singleton Pattern** để prevent concurrent refreshes:

```typescript
let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  // Nếu đã có refresh đang chạy → đợi nó
  if (refreshPromise) {
    return refreshPromise
  }

  // Tạo promise mới
  refreshPromise = doRefreshToken()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null // Clear để lần sau có thể refresh lại
  }
}

async function doRefreshToken(): Promise<string | null> {
  // Gọi INTERNAL Route Handler (không modify cookies trực tiếp)
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin', // Include cookies
  })

  const data = await response.json()
  return data.accessToken // Cookies đã được update bởi Route Handler
}
```

### 3. Axios Interceptor: `server-client.ts` / `client.ts`

**Không thay đổi** - vẫn gọi `refreshAccessToken()` như cũ:

```typescript
serverApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Gọi refresh (sẽ trigger chain: session.ts → route.ts)
      const newToken = await refreshAccessToken()

      if (newToken) {
        // Retry với token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return serverApiClient(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)
```

## 🔄 Flow hoàn chỉnh

```
User action → API request → 401 Error
    ↓
Axios interceptor bắt 401
    ↓
Gọi refreshAccessToken() trong session.ts
    ↓
Check singleton: Có refresh đang chạy không?
    ├─ Có → Đợi promise hiện tại
    └─ Không → Tạo promise mới
        ↓
        doRefreshToken() gọi fetch('/api/auth/refresh')
        ↓
        Route Handler nhận request
        ↓
        Route Handler gọi backend POST /auth/refresh
        ↓
        Backend trả về tokens mới
        ↓
        Route Handler UPDATE COOKIES ✅
        ↓
        Route Handler trả về accessToken
        ↓
        doRefreshToken() return accessToken
        ↓
        refreshAccessToken() return accessToken
    ↓
Axios interceptor retry request với token mới
    ↓
✅ Request thành công - User không bị gián đoạn
```

## 🎨 Ưu điểm

1. **✅ Next.js 15 Compliant:** Chỉ Route Handler modify cookies
2. **✅ Singleton Pattern:** Prevent multiple concurrent refreshes
3. **✅ Separation of Concerns:**
   - Route Handler = Cookie management
   - Session Manager = Business logic
   - Interceptor = Error handling
4. **✅ Type-safe:** TypeScript đầy đủ
5. **✅ Error Handling:** Clear errors tại mỗi layer
6. **✅ Scalable:** Dễ add thêm features (token rotation, blacklist, etc.)

## 🚀 Testing

```bash
# 1. Start dev server
npm run dev

# 2. Login vào hệ thống

# 3. Đợi 15 phút (hoặc modify token expiry ngắn hơn để test)

# 4. Thực hiện bất kỳ action nào (click button, load page, etc.)

# 5. Kiểm tra Network tab:
#    - Thấy request ban đầu fail với 401
#    - Thấy POST /api/auth/refresh được gọi
#    - Thấy request ban đầu được retry và thành công
```

## 📊 Logs để debug

- `console.error` trong Route Handler nếu refresh fail
- `console.error` trong session.ts nếu có lỗi
- Axios interceptor logs errors nếu retry fail

## 🔒 Security

- ✅ **HttpOnly cookies:** XSS protection
- ✅ **Secure flag:** HTTPS only (production)
- ✅ **SameSite: lax:** CSRF protection
- ✅ **Token rotation:** Refresh token đổi mỗi lần refresh
- ✅ **Short-lived access token:** 15 minutes
- ✅ **Long-lived refresh token:** 7 days

## 📝 Notes

- Route Handler `/api/auth/refresh` là **internal endpoint** (không expose ra ngoài)
- Singleton pattern đảm bảo chỉ 1 refresh call tại 1 thời điểm
- Nếu refresh fail → User được redirect về `/login`
- Cookies tự động được send với `credentials: 'same-origin'`
