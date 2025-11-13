# Hướng dẫn sử dụng Permission System

## Tổng quan

Hệ thống permission dựa trên API `/api/navigation` để kiểm tra quyền truy cập cho từng trang và từng action.

## Cấu trúc Permission

```typescript
{
  "id": "devices",
  "hasAccess": true,  // Quyền truy cập trang
  "actions": [
    {
      "id": "create",
      "hasAccess": false  // Không được phép tạo mới
    },
    {
      "id": "update",
      "hasAccess": true   // Được phép cập nhật
    },
    {
      "id": "delete",
      "hasAccess": false  // Không được phép xóa
    }
  ]
}
```

## Cách sử dụng

### 1. Sử dụng Hook `useActionPermission`

```tsx
import { useActionPermission } from '@/lib/hooks/useActionPermission'

function DevicesPage() {
  const { canCreate, canUpdate, canDelete, hasAccess } = useActionPermission('devices')

  return (
    <>
      {/* Chỉ hiển thị nút Create nếu có quyền */}
      {canCreate && <Button>Create Device</Button>}

      {/* Chỉ hiển thị nút Edit nếu có quyền */}
      {canUpdate && <Button>Edit</Button>}

      {/* Chỉ hiển thị nút Delete nếu có quyền */}
      {canDelete && <Button>Delete</Button>}
    </>
  )
}
```

### 2. Sử dụng Component `ActionGuard`

```tsx
import { ActionGuard } from '@/components/shared/ActionGuard'

function DevicesPage() {
  return (
    <>
      {/* Bảo vệ toàn bộ trang */}
      <ActionGuard pageId="devices" pageOnly>
        <div>Device Content</div>
      </ActionGuard>

      {/* Bảo vệ nút Create */}
      <ActionGuard pageId="devices" actionId="create">
        <Button>Create Device</Button>
      </ActionGuard>

      {/* Bảo vệ nút Edit */}
      <ActionGuard pageId="devices" actionId="update">
        <Button>Edit</Button>
      </ActionGuard>

      {/* Bảo vệ nút Delete với fallback */}
      <ActionGuard
        pageId="devices"
        actionId="delete"
        fallback={<span className="text-gray-400">No permission</span>}
      >
        <Button variant="destructive">Delete</Button>
      </ActionGuard>
    </>
  )
}
```

### 3. Check permission động

```tsx
import { useActionPermission } from '@/lib/hooks/useActionPermission'

function DevicesPage() {
  const { can } = useActionPermission('devices')

  // Check custom action
  if (can('filter-by-customer')) {
    // Show customer filter
  }

  if (can('export')) {
    // Show export button
  }
}
```

## Danh sách Page IDs

| Page ID            | Tên trang            |
| ------------------ | -------------------- |
| `dashboard`        | Tổng quan            |
| `revenue`          | Doanh thu            |
| `devices`          | Thiết bị             |
| `device-models`    | Mẫu thiết bị         |
| `contracts`        | Hợp đồng             |
| `consumable-types` | Loại vật tư tiêu hao |
| `users`            | Quản lý người dùng   |
| `customers`        | Khách hàng           |
| `policies`         | Quản lý policies     |
| `roles`            | Quản lý vai trò      |
| `departments`      | Quản lý bộ phận      |
| `system-settings`  | Cấu hình hệ thống    |

## Danh sách Action IDs phổ biến

| Action ID                | Mô tả               |
| ------------------------ | ------------------- |
| `create`                 | Tạo mới             |
| `update`                 | Chỉnh sửa           |
| `delete`                 | Xóa                 |
| `view`                   | Xem chi tiết        |
| `export`                 | Xuất dữ liệu        |
| `filter-by-customer`     | Lọc theo khách hàng |
| `filter-by-type`         | Lọc theo loại       |
| `filter-by-manufacturer` | Lọc theo hãng       |
| `filter-by-role`         | Lọc theo vai trò    |
| `filter-by-department`   | Lọc theo bộ phận    |

## Best Practices

1. **Luôn check permission ở cấp độ UI**: Ngăn user nhìn thấy các nút/chức năng họ không có quyền
2. **Backend vẫn phải validate**: UI permission chỉ là UX, không phải security
3. **Sử dụng ActionGuard cho UI đơn giản**: Wrapper component dễ đọc hơn
4. **Sử dụng hook cho logic phức tạp**: Khi cần nhiều điều kiện kết hợp
5. **Fallback thân thiện**: Hiển thị thông báo rõ ràng khi không có quyền

## Ví dụ thực tế

### Devices Page với đầy đủ permissions

```tsx
'use client'

import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'

export default function DevicesPageClient() {
  const { canCreate, canUpdate, canDelete, can } = useActionPermission('devices')

  return (
    <div>
      {/* Header với nút Create */}
      <div className="flex justify-between">
        <h1>Devices</h1>
        <ActionGuard pageId="devices" actionId="create">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Device
          </Button>
        </ActionGuard>
      </div>

      {/* Customer filter - chỉ hiện nếu có quyền */}
      {can('filter-by-customer') && <CustomerSelect onChange={handleCustomerFilter} />}

      {/* Device list */}
      {devices.map((device) => (
        <div key={device.id} className="flex gap-2">
          <span>{device.name}</span>

          {/* Edit button */}
          <ActionGuard pageId="devices" actionId="update">
            <Button onClick={() => handleEdit(device)}>
              <Edit className="h-4 w-4" />
            </Button>
          </ActionGuard>

          {/* Delete button */}
          <ActionGuard pageId="devices" actionId="delete">
            <Button variant="destructive" onClick={() => handleDelete(device)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </ActionGuard>
        </div>
      ))}
    </div>
  )
}
```
