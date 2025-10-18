# Token Refresh Mechanism - MPS Frontend

## Tổng quan

Hệ thống sử dụng JWT tokens với 2 loại:

- **Access Token**: Thời hạn ngắn (15 phút) - Dùng cho mọi API requests
- **Refresh Token**: Thời hạn dài (7 ngày) - Dùng để lấy access token mới

## Cách hoạt động

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. API Request với Access Token
       ▼
┌─────────────────────────────┐
│  API Interceptor            │
│  (serverApiClient/client)   │
└──────┬──────────────────────┘
       │
       ├─── Token hợp lệ ────────────► Continue Request ──► Response
       │
       └─── 401 Unauthorized
              │
              ▼
       ┌─────────────────────┐
       │ refreshAccessToken()│
       │   (session.ts)      │
       └──────┬──────────────┘
              │
              │ 2. POST /auth/refresh
              │    Body: { refreshToken }
              ▼
       ┌─────────────────────┐
       │   Backend API       │
       └──────┬──────────────┘
              │
              ├─── Success ──────────► New Tokens
              │                         │
              │                         ▼
              │                    ┌────────────────┐
              │                    │ Update Cookies │
              │                    │ - access_token │
              │                    │ - refresh_token│
              │                    └────────┬───────┘
              │                             │
              │                             ▼
              │                    Retry Original Request
              │
              └─── Failed ───────────► Clear Auth Data
                                       Redirect to /login
```

## Implementation Details

### 1. Token Storage (Cookies)

```typescript
// src/lib/auth/session.ts

// Cookie names
const SESSION_COOKIE_NAME = 'mps_session' // JWT session data
const ACCESS_TOKEN_COOKIE_NAME = 'access_token' // 15 min
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token' // 7 days

// All cookies are httpOnly, secure (in production), sameSite: 'lax'
```

### 2. Refresh Token Function

**Location**: `src/lib/auth/session.ts`

```typescript
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken()

    if (!refreshToken) return null

    // Call refresh API using axios
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
        validateStatus: (status) => status < 500,
      }
    )

    // Handle response: { success, data: { accessToken, refreshToken } }
    const responseData = response.data

    // Extract tokens (supports multiple formats)
    let newAccessToken, newRefreshToken
    if ('data' in responseData && responseData.data) {
      newAccessToken = responseData.data.accessToken
      newRefreshToken = responseData.data.refreshToken
    } else {
      newAccessToken = responseData.accessToken
      newRefreshToken = responseData.refreshToken
    }

    // Update cookies
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, { ... })

    // Update refresh token if provided (token rotation)
    if (newRefreshToken) {
      cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, { ... })
    }

    return newAccessToken
  } catch (error) {
    // Clear all auth data and redirect to login
    // ...
    return null
  }
}
```

**Tại sao dùng `axios` thay vì `serverApiClient`?**

- Tránh circular dependency (serverApiClient đã import refreshAccessToken)
- `axios.post` vẫn là server-side call (không phải client fetch)
- Có đầy đủ features: timeout, headers, status validation

### 3. Auto Refresh on 401

#### Server-side (serverApiClient)

**Location**: `src/lib/api/server-client.ts`

```typescript
serverApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    // Handle 401 - try refresh token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()

        if (newToken && originalRequest.headers) {
          // Set new token and retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return serverApiClient(originalRequest)
        }
      } catch (refreshError) {
        return Promise.reject(new Error('Authentication failed'))
      }
    }

    return Promise.reject(error)
  }
)
```

#### Client-side (apiClient)

**Location**: `src/lib/api/client.ts`

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Call server action to refresh
        const newToken = await refreshAccessTokenForClient()

        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Redirect to login on client
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)
```

### 4. Server Action for Client

**Location**: `src/lib/auth/server-actions.ts`

```typescript
'use server'

export async function refreshAccessTokenForClient(): Promise<string | null> {
  return await refreshAccessToken()
}
```

Client components không thể gọi trực tiếp `refreshAccessToken()` (server-only), nên cần server action làm proxy.

## API Response Format

### Request

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note**: Refresh token cũng được update (token rotation) để tăng security.

### Response (Error)

```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

## Token Expiration Times

| Token         | Expiry     | Cookie MaxAge | Purpose                 |
| ------------- | ---------- | ------------- | ----------------------- |
| Access Token  | 15 minutes | 900s          | API authentication      |
| Refresh Token | 7 days     | 604800s       | Get new access token    |
| Session JWT   | 8 hours    | 28800s        | Store user session data |

## Error Handling

### 1. No Refresh Token

```typescript
if (!refreshToken) {
  console.error('No refresh token available')
  return null
}
```

**Action**: Return null, let calling code handle redirect

### 2. Refresh API 404

```typescript
if (response.status === 404) {
  console.error('Refresh endpoint not found')
  // Clear cookies and redirect
  destroySession()
  redirect('/login')
}
```

**Action**: Clear all auth data, redirect to login

### 3. Invalid/Expired Refresh Token

```typescript
if (response.status !== 200) {
  console.error('Failed to refresh token')
  // Clear cookies
  destroySession()
  return null
}
```

**Action**: Clear cookies, return null

### 4. Network Error

```typescript
catch (error) {
  console.error('Error refreshing access token:', error)
  destroySession()
  redirect('/login')
}
```

**Action**: Clear cookies, redirect to login

## Testing

### Manual Test Page

URL: `http://localhost:3000/debug/token-refresh`

Features:

- **Normal Request**: Test regular authenticated API call
- **Expired Token Test**: Simulate 401 to trigger refresh
- **Manual Refresh**: Direct refresh token call

### Test Scenarios

#### 1. Auto Refresh on API Call

```typescript
// Make API call after 15 minutes (access token expired)
const users = await usersService.getUsers()
// Should automatically refresh and retry
```

**Expected**:

- See 401 error
- Auto refresh token
- Retry original request
- Return data successfully

#### 2. Manual Refresh

```typescript
const newToken = await refreshAccessToken()
console.log('New token:', newToken)
```

**Expected**:

- POST /auth/refresh called
- New tokens in cookies
- Function returns new access token

#### 3. Expired Refresh Token

```typescript
// After 7 days, refresh token expires
const users = await usersService.getUsers()
```

**Expected**:

- 401 error
- Refresh attempt fails
- Cookies cleared
- Redirect to /login

## Security Considerations

### 1. HttpOnly Cookies

✅ Tokens stored in httpOnly cookies → Cannot be accessed by JavaScript → XSS protection

### 2. Token Rotation

✅ Refresh token is updated on each refresh → Old refresh tokens become invalid

### 3. Short-lived Access Tokens

✅ 15 minutes expiry → Minimize damage if token is compromised

### 4. Secure Flag

✅ In production, cookies use `secure: true` → HTTPS only

### 5. SameSite Protection

✅ `sameSite: 'lax'` → CSRF protection

## Debugging

### Check Cookies

**Browser DevTools**:

1. Open DevTools → Application → Cookies
2. Look for:
   - `mps_session`
   - `access_token`
   - `refresh_token`

**Debug Page**: `http://localhost:3000/debug/auth-status`

### Check Refresh Logs

```bash
# Server logs will show:
# 🔄 401 Unauthorized - Attempting token refresh...
# ✅ Token refreshed, retrying original request

# Or on error:
# ❌ Token refresh failed - no new token received
```

### Check Network Tab

1. Make API call that triggers 401
2. Should see:
   - First request: 401 Unauthorized
   - POST /auth/refresh: 200 OK
   - Retry original request: 200 OK

## Flow Examples

### Example 1: Successful Auto-Refresh

```
User opens /customer-admin/users
↓
Component fetches users (access token expired)
↓
GET /users → 401 Unauthorized
↓
Interceptor catches 401
↓
POST /auth/refresh with refresh token
↓
Backend returns new tokens
↓
Update cookies with new tokens
↓
Retry GET /users with new access token
↓
GET /users → 200 OK
↓
Display users list
```

### Example 2: Refresh Token Expired

```
User opens /customer-admin/users (after 7 days)
↓
Component fetches users
↓
GET /users → 401 Unauthorized
↓
Interceptor catches 401
↓
POST /auth/refresh with expired refresh token
↓
Backend returns 401 (invalid token)
↓
Clear all cookies
↓
Redirect to /login
```

## Files Modified/Created

### Core Files

- `src/lib/auth/session.ts` - Token management & refresh logic
- `src/lib/auth/server-actions.ts` - Server actions for client
- `src/lib/api/server-client.ts` - Server-side interceptor
- `src/lib/api/client.ts` - Client-side interceptor

### Test Files

- `src/app/debug/token-refresh/page.tsx` - Test UI
- `src/app/api/test-auth/route.ts` - Test endpoint
- `src/app/api/refresh-token/route.ts` - Manual refresh endpoint

## Best Practices

✅ **DO**:

- Use server-side tokens (cookies) for authentication
- Implement automatic token refresh on 401
- Clear all auth data when refresh fails
- Use short-lived access tokens
- Rotate refresh tokens on each use

❌ **DON'T**:

- Store tokens in localStorage (XSS vulnerable)
- Expose refresh token to client JavaScript
- Make refresh tokens long-lived (> 7 days)
- Retry refresh indefinitely (set \_retry flag)
- Forget to clear cookies on logout

## References

- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Next.js 15 Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
