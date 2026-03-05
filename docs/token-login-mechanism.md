# Cơ chế Token và Login — MPS

Tài liệu này mô tả chi tiết cơ chế xác thực (login) và quản lý token của hệ thống MPS: luồng cấp token, lưu trữ, refresh, middleware kiểm tra, và các client/server API liên quan.

---

## 1. Tổng quan

- Hệ thống dùng kết hợp **Session JWT** (dùng nội bộ trong ứng dụng Next.js) và **Access / Refresh tokens** (dùng để gọi Backend API).
- Cookies HTTP-only được sử dụng cho mọi token: `mps_session`, `access_token`, `refresh_token`.
- Mục tiêu: bảo mật (httpOnly, secure, sameSite), trải nghiệm mượt (refresh tự động, tránh race conditions).

## 2. Các loại token

1. Session JWT (`mps_session`)
   - Mục đích: chứa thông tin session (userId, customerId, role, email, flags như `isDefaultPassword`, `isDefaultCustomer`).
   - Thời hạn: 8 giờ.
   - Ký bằng HS256 với `JWT_SECRET`.
   - Dùng bởi middleware của Next.js để xác thực trước khi xử lý route.

2. Access Token (`access_token`)
   - Mục đích: xác thực cuộc gọi tới Backend API (gắn header `Authorization: Bearer ...`).
   - Thời hạn: ~15 phút.
   - Lưu trong cookie httpOnly để tránh truy cập từ JS.

3. Refresh Token (`refresh_token`)
   - Mục đích: cấp mới Access Token khi hết hạn.
   - Thời hạn: ~7 ngày.
   - Được lưu httpOnly; chỉ gửi tới endpoint refresh an toàn.

## 3. Thiết lập cookie và bảo mật

- Cờ bảo mật:
  - `httpOnly: true` — ngăn truy cập từ JavaScript (giảm rủi ro XSS).
  - `secure: true` khi `NODE_ENV === 'production'` (trừ khi bật `ALLOW_INSECURE_COOKIES`).
  - `sameSite: 'lax'` — giảm rủi ro CSRF cho các request cross-site.
  - `path: '/'` — áp dụng toàn site.
- Cấu hình nằm trong mã: logic xác định `IS_SECURE_COOKIES` trước khi set cookie.

## 4. Luồng đăng nhập (Login)

1. Client gửi form (email + password) tới Server Action `login` (file: `src/app/actions/auth.ts`).
2. Server Action gọi Backend API (`/auth/login`) qua `serverApiClient`.
3. Backend trả về payload chứa `user`, `accessToken`, `refreshToken`, và các flag (ví dụ `isDefaultPassword`).
4. Server tạo session JWT từ `session` payload và set ba cookie: `mps_session` (JWT), `access_token`, `refresh_token` — hàm thực hiện trong `src/lib/auth/session.ts` (`createSessionWithTokens`).
5. Server Action trả về trạng thái thành công cho client; client (trong `login/page.tsx`) lưu một vài thông tin phi-bảo mật vào `localStorage` để hiển thị giao diện (role, customer name), rồi redirect tới dashboard phù hợp.

# Cơ chế Token và Login — MPS (Mô tả chi tiết)

Tài liệu này mô tả chi tiết kỹ thuật về cơ chế xác thực (login) và quản lý token của hệ thống MPS: cấu trúc token, cách lưu trữ, các endpoint liên quan, luồng refresh, middleware, client/server API, ví dụ thao tác (curl), và hướng dẫn debug.

---

## Mục lục

- Tổng quan
- Các loại token và cấu trúc
- Cookie & cấu hình bảo mật
- Luồng đăng nhập (step-by-step + ví dụ request/response)
- Luồng refresh (server-side / client-side / API route)
- Middleware và xác thực cho route (Edge Runtime)
- API clients (serverApiClient / internalApiClient)
- Xử lý lỗi & race conditions
- Ví dụ curl / JSON responses
- Debugging tips
- Security recommendations
- Appendix: danh sách endpoints quan trọng

---

## 1. Tổng quan

Hệ thống kết hợp hai cơ chế chính:

- `Session JWT` dùng nội bộ cho Next.js app (cookie `mps_session`) để xác thực navigation, phân quyền, và inject thông tin user cho Server Components.
- Cặp `Access Token` / `Refresh Token` dùng để xác thực các cuộc gọi tới Backend API. Cả 3 token đều được lưu dưới dạng httpOnly cookies trên domain của ứng dụng.

Mục tiêu: bảo mật (ngăn XSS/CSRF), UX mượt (tự động refresh access token), tránh race condition khi nhiều request cùng gặp 401.

## 2. Các loại token và cấu trúc

2.1 Session JWT (`mps_session`)

- Payload (ví dụ):

```json
{
  "userId": "uuid-123",
  "customerId": "cust-456",
  "role": "Admin",
  "username": "user@example.com",
  "email": "user@example.com",
  "isDefaultPassword": false,
  "isDefaultCustomer": true
}
```

- Thuộc tính:
  - Ký bằng HS256 (`JWT_SECRET`), expiration `8h`.
  - Dùng bởi `src/middleware.ts` để kiểm tra truy cập route và inject headers.

  2.2 Access Token (`access_token`)

- Dùng để gọi Backend API, gắn header `Authorization: Bearer <token>` khi server-side gọi backend.
- Expiry: ~15 phút.

  2.3 Refresh Token (`refresh_token`)

- Dùng để lấy `access_token` mới khi access hết hạn.
- Expiry: ~7 ngày (tuỳ cấu hình backend).

## 3. Cookie & cấu hình bảo mật

Cookies được set với các flags bảo mật:

- `httpOnly: true` — không thể truy cập bằng JS.
- `secure: IS_SECURE_COOKIES` — chỉ bật trên production (có tuỳ chọn `ALLOW_INSECURE_COOKIES` cho test).
- `sameSite: 'lax'` — hạn chế CSRF cho các request cross-site; phù hợp với nhiều SPA.
- `path: '/'` — cookie áp dụng toàn domain.

Đoạn cấu hình trong mã:

```ts
const IS_SECURE_COOKIES =
  process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true'
```

## 4. Luồng đăng nhập (Login) — chi tiết step-by-step

4.1 Client → Server Action

- Client (form) gửi `email` + `password` tới Server Action `login` (`src/app/actions/auth.ts`). Server Action chạy trên server (Next.js Server Actions).

  4.2 Server Action → Backend API

- `login` gọi backend endpoint (ví dụ `${NEXT_PUBLIC_API_URL}/auth/login`) thông qua `serverApiClient`.

Ví dụ response backend (thường):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "customerId": "cust-456",
      "role": { "name": "Admin" }
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "def456...",
    "isDefaultPassword": false,
    "isDefaultCustomer": true
  }
}
```

4.3 Tạo session & set cookies

- `createSessionWithTokens` trong `src/lib/auth/session.ts` thực hiện:
  - Tạo `mps_session` là JWT chứa `session` payload (8h).
  - Set `access_token` cookie (15 phút).
  - Set `refresh_token` cookie (7 ngày).

  4.4 Trả về client

- Server Action trả về trạng thái thành công; client lưu một số thông tin hiển thị (localStorage) và redirect theo `isDefaultPassword` / `isDefaultCustomer`.

## 5. Luồng refresh token (chi tiết thực thi)

5.1 API route refresh (Next.js)

- Route: `POST /api/auth/refresh` (file: `src/app/api/auth/refresh/route.ts`).
- Công việc của route:
  1. Lấy `refresh_token` từ cookie server-side.
  2. Gọi backend `${NEXT_PUBLIC_API_URL}/auth/refresh` với payload `{ refreshToken }`.
  3. Nếu backend trả `accessToken` (và có thể `refreshToken` mới), cập nhật cookies (httpOnly).
  4. Nếu thất bại, xóa cookies auth và trả 401.

  5.2 Server-side pre-render (Server Components)

- `ensureValidToken()` được gọi ở đầu các Server Components cần auth:
  - Nếu có `access_token` → tiếp tục.
  - Nếu không có `access_token` nhưng có `refresh_token` → gọi backend refresh (axios) và update cookies.
  - Nếu refresh không thành công → xóa cookies và trả false.

  5.3 Client-side internal API client

- `src/lib/api/internal-client.ts` (axios) xử lý 401 bằng interceptor:
  - Khi nhận 401 (và request chưa được retry):
    - Nếu đang trong quá trình refresh (`isRefreshing`), chờ `refreshPromise` rồi retry.
    - Nếu chưa, tạo `refreshPromise` bằng fetch(`/api/auth/refresh`, { credentials: 'include' }).
    - Nếu refresh thành công, chờ 100ms để cookie được set, sau đó retry request gốc.
    - Nếu refresh thất bại, redirect client về `/login`.

## 6. Middleware (Edge Runtime) — hành vi chi tiết

File: `src/middleware.ts`

- Chạy trên Edge Runtime, kiểm tra `mps_session` cookie cho mỗi request (ngoại trừ public routes).
- Nếu không có session:
  - với GET (navigations) → redirect tới `/login` và xóa cookies.
  - với non-GET (API/Server Actions) → trả 401 JSON.
- Nếu `session.isDefaultPassword` và không ở trang đổi mật khẩu → redirect tới `/change-password?required=true`.
- Phân quyền theo `isDefaultCustomer` để giới hạn `/system` routes.
- Inject header `x-user-id`, `x-customer-id`, `x-user-role` vào request để Server Components truy xuất nhanh.

## 7. API clients & interceptor behavior — chi tiết kỹ thuật

7.1 `serverApiClient` (`src/lib/api/server-client.ts`)

- Dùng trong Server Components / Server Actions.
- Trước request: đọc `access_token` từ cookie server-side (`getAccessToken()`) và gắn `Authorization: Bearer ${token}`.
- Response interceptor không tự refresh — ném lỗi 401 để Server Component hoặc middleware xử lý.

  7.2 `internalApiClient` (`src/lib/api/internal-client.ts`)

- Dùng client-side để gọi Next.js API routes (base `/`).
- `withCredentials: true` để trình duyệt gửi cookies.
- Có cơ chế:
  - `getDedupeMap` cho GET requests để tránh trùng lặp.
  - `isRefreshing` + `refreshPromise` để serialize refresh flow.
  - Retry logic sau khi refresh thành công.

## 8. Xử lý lỗi, race conditions và các corner cases

- Race condition khi nhiều request cùng gặp 401: đã xử lý bằng `isRefreshing` + `refreshPromise` — các request mới sẽ chờ refresh hoàn tất và retry.
- Nếu refresh route trả lỗi (ví dụ refresh token expired), server sẽ xóa cookies và client sẽ bị redirect login.
- `serverApiClient` deliberately does NOT auto-refresh to avoid circular server-side behavior — Server Components dùng `ensureValidToken()` trước render.

## 9. Ví dụ request / curl

9.1 Login (client → server action → backend)

Backend example curl (thông thường server action gọi backend, đây là ví dụ backend endpoint):

```bash
curl -X POST "${NEXT_PUBLIC_API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

Response (ví dụ):

```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid-123", "email": "user@example.com" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "def456..."
  }
}
```

9.2 Refresh token (Next.js API route)

Client/internal-client gọi:

```bash
curl -X POST "https://your-app.example.com/api/auth/refresh" \
  -H "Content-Type: application/json" \
  --cookie "refresh_token=<refresh-token>" \
  -c cookies.txt
```

Response (ví dụ):

```json
{ "accessToken": "newAccessTokenHere", "success": true }
```

## 10. Debugging tips

- Cookie names: `mps_session`, `access_token`, `refresh_token`. Kiểm tra trên browser DevTools → Application → Cookies.
- Middleware logs: `console.error` trong `src/middleware.ts` và các file `ensure-valid-token.ts` / `internal-client.ts` có console logs để debug luồng refresh.
- Để mô phỏng refresh failure: xóa `refresh_token` cookie hoặc cấu hình backend trả 401 cho `/auth/refresh`.
- Kiểm tra JWT payload nhanh bằng jwt.io (chỉ với token non-secret phần header/payload) — không gửi secret.
- Nếu server-side gặp 401 trong `serverApiClient`, trace đến nơi `ensureValidToken()` được gọi.

## 11. Security recommendations (nâng cao)

- Luôn rotate refresh tokens trên backend và trả refresh token mới khi refresh thành công.
- Giữ `JWT_SECRET` an toàn (environment variable), không commit vào repo.
- Xem xét CSRF token cho các thao tác có rủi ro nếu app cần cross-site POST từ 3rd-party.
- Giới hạn scope của access tokens nếu backend hỗ trợ.
- Audit logs cho login/refresh/revoke operations.

## 12. Appendix — Endpoints quan trọng

- `POST ${NEXT_PUBLIC_API_URL}/auth/login` — login backend (email/password) → trả accessToken + refreshToken + user
- `POST ${NEXT_PUBLIC_API_URL}/auth/refresh` — backend refresh endpoint (accepts refreshToken) → trả accessToken (+ refreshToken)
- `POST /api/auth/refresh` — Next.js internal route: đọc cookie `refresh_token`, gọi backend refresh và set cookies mới
- `GET /api/...` - các API route của Next.js gọi `serverApiClient` gắn `Authorization` header tự động khi render server-side

---

Nếu bạn muốn tôi:

- thêm sơ đồ luồng (ASCII hoặc hình ảnh SVG),
- thêm ví dụ debug step-by-step (kịch bản logs + đề xuất lệnh curl),
- hoặc commit file này với message cụ thể,

hãy cho biết lựa chọn tiếp theo.
