'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'

interface NavigationTrackerProps {
  deviceId?: string
  deviceName?: string
  serviceRequestId?: string
  serviceRequestName?: string
  purchaseRequestId?: string
  purchaseRequestName?: string
  userId?: string
  userName?: string
}

/**
 * Component to track current page and update sidebar submenu
 */
export function NavigationTracker({
  deviceId,
  deviceName,
  serviceRequestId,
  serviceRequestName,
  purchaseRequestId,
  purchaseRequestName,
  userId,
  userName,
}: NavigationTrackerProps) {
  const pathname = usePathname()
  const { setCurrentSubmenu } = useNavigation()

  useEffect(() => {
    // Device detail page
    if (deviceId && deviceName) {
      setCurrentSubmenu({
        label: deviceName,
        href: `/system/devices/${deviceId}`,
      })
    }
    // Service request detail page
    else if (serviceRequestId && serviceRequestName) {
      setCurrentSubmenu({
        label: serviceRequestName,
        href: `/system/service-requests/${serviceRequestId}`,
      })
    }
    // Purchase request detail page
    else if (purchaseRequestId && purchaseRequestName) {
      setCurrentSubmenu({
        label: purchaseRequestName,
        href: `/system/purchase-requests/${purchaseRequestId}`,
      })
    }
    // User detail page
    else if (userId && userName) {
      setCurrentSubmenu({
        label: userName,
        href: `/system/users/${userId}`,
      })
    }
    // Clear submenu when on list pages
    else {
      setCurrentSubmenu(null)
    }

    // Cleanup on unmount
    return () => {
      setCurrentSubmenu(null)
    }
  }, [
    pathname,
    deviceId,
    deviceName,
    serviceRequestId,
    serviceRequestName,
    purchaseRequestId,
    purchaseRequestName,
    userId,
    userName,
    setCurrentSubmenu,
  ])

  return null
}
