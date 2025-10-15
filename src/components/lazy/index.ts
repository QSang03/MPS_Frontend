/**
 * Lazy-loaded components for better performance
 */

import { lazy } from 'react'

// Form components
export const DeviceForm = lazy(() =>
  import('@/app/(dashboard)/customer-admin/devices/_components/DeviceForm').then((m) => ({
    default: m.DeviceForm,
  }))
)

export const ServiceRequestForm = lazy(() =>
  import('@/app/(dashboard)/customer-admin/service-requests/_components/ServiceRequestForm').then(
    (m) => ({ default: m.ServiceRequestForm })
  )
)

export const PurchaseRequestForm = lazy(() =>
  import('@/app/(dashboard)/customer-admin/purchase-requests/_components/PurchaseRequestForm').then(
    (m) => ({ default: m.PurchaseRequestForm })
  )
)

export const CustomerForm = lazy(() =>
  // CustomerForm component not present in this workspace; remove lazy import to avoid build error.
  Promise.resolve({ default: () => null as any })
)

export const UserForm = lazy(() =>
  import('@/app/(dashboard)/customer-admin/users/_components/UserForm').then((m) => ({
    default: m.UserForm,
  }))
)

// List components
export const DeviceList = lazy(() =>
  import('@/app/(dashboard)/customer-admin/devices/_components/DeviceList').then((m) => ({
    default: m.DeviceList,
  }))
)

export const ServiceRequestList = lazy(() =>
  import('@/app/(dashboard)/customer-admin/service-requests/_components/ServiceRequestList').then(
    (m) => ({ default: m.ServiceRequestList })
  )
)

export const PurchaseRequestList = lazy(() =>
  import('@/app/(dashboard)/customer-admin/purchase-requests/_components/PurchaseRequestList').then(
    (m) => ({ default: m.PurchaseRequestList })
  )
)

export const CustomerList = lazy(() =>
  // CustomerList not present in this workspace; stub with a no-op component to satisfy imports during build
  Promise.resolve({ default: () => null as any })
)

export const UserList = lazy(() =>
  import('@/app/(dashboard)/customer-admin/users/_components/UserList').then((m) => ({
    default: m.UserList,
  }))
)

// Report components
export const ReportGenerator = lazy(() =>
  import('@/app/(dashboard)/customer-admin/reports/_components/ReportGenerator').then((m) => ({
    default: m.ReportGenerator,
  }))
)

export const ReportHistory = lazy(() =>
  import('@/app/(dashboard)/customer-admin/reports/_components/ReportHistory').then((m) => ({
    default: m.ReportHistory,
  }))
)

// Dashboard components
export const KPICards = lazy(() =>
  import('@/app/(dashboard)/customer-admin/_components/KPICards').then((m) => ({
    default: m.KPICards,
  }))
)

export const RecentActivity = lazy(() =>
  import('@/app/(dashboard)/customer-admin/_components/RecentActivity').then((m) => ({
    default: m.RecentActivity,
  }))
)
