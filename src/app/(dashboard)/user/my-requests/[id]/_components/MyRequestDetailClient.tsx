'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { ServiceRequestDetailClient } from './ServiceRequestDetailClient'
import { PurchaseRequestDetailClient } from '@/app/(dashboard)/system/purchase-requests/[id]/_components/PurchaseRequestDetailClient'
import type { Session } from '@/lib/auth/session'

interface Props {
  id: string
  session: Session | null
}

export default function MyRequestDetailClient({ id, session }: Props) {
  // Try to fetch a purchase request by id. If found, render the PurchaseRequestDetail view.
  // If not found (404 / error), fallback to the service request detail view.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchase-requests', 'detail', id],
    queryFn: () => purchaseRequestsClientService.getById(id),
    retry: false,
    // we want this query to run on client only
  })

  if (isLoading) {
    // While determining, show the service request loader to keep UX snappy
    return <ServiceRequestDetailClient id={id} />
  }

  if (data && !isError) {
    // Render the purchase request detail (session passed for permission checks in system component)
    return <PurchaseRequestDetailClient id={id} session={session} />
  }

  // Fallback to service request detail
  return <ServiceRequestDetailClient id={id} session={session} />
}
