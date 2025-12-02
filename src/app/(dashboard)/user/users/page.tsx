'use client'

import React from 'react'
import { UsersTable } from './_components/UsersTable'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export default function UsersPage() {
  return (
    <UserPageLayout>
      <div className="space-y-6">
        <UsersTable />
      </div>
    </UserPageLayout>
  )
}
