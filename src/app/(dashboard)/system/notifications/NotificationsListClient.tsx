'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { notificationsClientService } from '@/lib/api/services/notifications-client.service'
import type { Notification, NotificationMetadata } from '@/types/models/notification'
import { toast } from 'sonner'

import { NotificationHeader } from './_components/NotificationHeader'
import {
  NotificationFilters,
  FilterType,
  NotificationType,
} from './_components/NotificationFilters'
import { NotificationList } from './_components/NotificationList'

export default function NotificationsListClient() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // State for filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [activeType, setActiveType] = useState<NotificationType>('ALL')

  // Fetch notifications
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsClientService.getAll({ page: 1, limit: 100 }), // Fetch more to simulate client-side filtering
  })

  const notifications = useMemo<Notification[]>(
    () => (Array.isArray(data?.data) ? data!.data : []),
    [data]
  )

  // Calculate stats
  const unreadCount = notifications.filter((n) => n.status !== 'READ').length
  const totalCount = notifications.length

  // Mutations

  const handleClearFilters = () => {
    setSearchQuery('')
    setActiveFilter('ALL')
    setActiveType('ALL')
  }
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsClientService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification marked as read')
    },
    onError: () => {
      toast.error('Failed to mark as read')
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsClientService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  // Handlers
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    // Mock delete for now as API is not available
    toast.success(`Notification ${id} deleted (Mock)`)
    // In a real app, we would call delete API here
  }

  const handleViewDetails = (n: Notification) => {
    // Mark as read if unread
    if (n.status !== 'READ') {
      markAsReadMutation.mutate(n.id)
    }

    // Navigate logic
    const meta = n as unknown as { metadata?: { requestId?: string; type?: string } }
    const metaType = meta.metadata?.type?.toLowerCase()
    const requestId = meta.metadata?.requestId || n.alertId

    // Helper to extract UUID
    const extractId = (text: string) => {
      const match = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
      return match ? match[0] : null
    }

    const id = requestId || extractId(`${n.title} ${n.message || ''}`)

    if (id) {
      if (metaType === 'service' || n.title.toLowerCase().includes('service')) {
        router.push(`/system/service-requests/${id}`)
        return
      }
      if (metaType === 'purchase' || n.title.toLowerCase().includes('purchase')) {
        router.push(`/system/purchase-requests/${id}`)
        return
      }
    }

    // Default fallback
    router.push('/system/notifications')
  }

  const handleMarkAll = () => {
    markAllMutation.mutate()
  }

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const meta = n as Notification & { metadata?: NotificationMetadata }

      // 1. Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const title = n.title.toLowerCase()
        const message = (n.message || '').toLowerCase()
        const requestId = (meta.metadata?.requestNumber || '').toLowerCase()

        if (!title.includes(query) && !message.includes(query) && !requestId.includes(query)) {
          return false
        }
      }

      // 2. Status Filter
      if (activeFilter === 'UNREAD' && n.status === 'READ') return false
      if (activeFilter === 'READ' && n.status !== 'READ') return false

      // 3. Type Filter
      if (activeType !== 'ALL') {
        const metaType = (meta.metadata?.type || '').toLowerCase()
        const title = n.title.toLowerCase()

        if (activeType === 'PURCHASE' && metaType !== 'purchase' && !title.includes('purchase'))
          return false
        if (activeType === 'SERVICE' && metaType !== 'service' && !title.includes('service'))
          return false
        if (activeType === 'SYSTEM' && !title.includes('alert') && !title.includes('system'))
          return false
      }

      return true
    })
  }, [notifications, searchQuery, activeFilter, activeType])

  return (
    <div className="space-y-6 pb-10">
      <NotificationHeader
        unreadCount={unreadCount}
        totalCount={totalCount}
        onRefresh={() => refetch()}
        onMarkAllAsRead={handleMarkAll}
        isRefreshing={isRefetching}
      />

      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <NotificationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          activeType={activeType}
          onTypeChange={setActiveType}
          onClearFilters={handleClearFilters}
          resultCount={filteredNotifications.length}
        />

        <div className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </div>
  )
}
