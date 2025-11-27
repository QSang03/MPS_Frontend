/**
 * Lazy-loaded components for better performance
 */

import { lazy } from 'react'

// Form components

export const ServiceRequestForm = lazy(() =>
  import('@/app/(dashboard)/system/service-requests/_components/ServiceRequestForm').then((m) => ({
    default: m.ServiceRequestForm,
  }))
)

export const PurchaseRequestForm = lazy(() =>
  import('@/app/(dashboard)/system/purchase-requests/_components/PurchaseRequestForm').then(
    (m) => ({ default: m.PurchaseRequestForm })
  )
)

export const UserForm = lazy(() =>
  import('@/app/(dashboard)/system/users/_components/UserForm').then((m) => ({
    default: m.UserForm,
  }))
)

// List components

export const ServiceRequestList = lazy(() =>
  import('@/app/(dashboard)/system/service-requests/_components/ServiceRequestList').then((m) => ({
    default: m.ServiceRequestList,
  }))
)

export const PurchaseRequestList = lazy(() =>
  import('@/app/(dashboard)/system/purchase-requests/_components/PurchaseRequestList').then(
    (m) => ({ default: m.PurchaseRequestList })
  )
)

export const UserList = lazy(() =>
  import('@/app/(dashboard)/system/users/_components/UserList').then((m) => ({
    default: m.UserList,
  }))
)

export const WarehouseDocumentList = lazy(() =>
  import('@/app/(dashboard)/system/warehouse-documents/_components/WarehouseDocumentList').then(
    (m) => ({ default: m.WarehouseDocumentList })
  )
)

// Report components
export const ReportGenerator = lazy(() =>
  import('@/app/(dashboard)/system/reports/_components/ReportGenerator').then((m) => ({
    default: m.ReportGenerator,
  }))
)

export const ReportHistory = lazy(() =>
  import('@/app/(dashboard)/system/reports/_components/ReportHistory').then((m) => ({
    default: m.ReportHistory,
  }))
)

// Dashboard components
export const KPICards = lazy(() =>
  import('@/app/(dashboard)/system/_components/KPICards').then((m) => ({
    default: m.KPICards,
  }))
)

export const RecentActivity = lazy(() =>
  import('@/app/(dashboard)/system/_components/RecentActivity').then((m) => ({
    default: m.RecentActivity,
  }))
)
