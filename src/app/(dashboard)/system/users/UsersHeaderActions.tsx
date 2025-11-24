'use client'

import React from 'react'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { UserFormModal } from './_components/UserFormModal'

export default function UsersHeaderActions({ customerId = '' }: { customerId?: string }) {
  return (
    <ActionGuard pageId="users" actionId="create">
      <UserFormModal customerId={customerId} />
    </ActionGuard>
  )
}
