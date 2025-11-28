'use client'

import dynamic from 'next/dynamic'

const NotificationsListClient = dynamic(
  () => import('./NotificationsListClient').then((mod) => mod.default),
  { ssr: false }
)

export default function NotificationsListWrapper() {
  return <NotificationsListClient />
}
