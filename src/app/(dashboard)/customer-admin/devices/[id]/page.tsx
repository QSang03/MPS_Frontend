import { redirect } from 'next/navigation'

// If the global devices route is removed from the UI, redirect accesses to the models list
export default async function DeviceDetailPage() {
  // Always redirect to device models table
  redirect('/customer-admin/device-models')
}
