'use client'

import { useState } from 'react'
import { RolesTable } from './_components/RolesTable'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Layers, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionGuard } from '@/components/shared/ActionGuard'

export default function RolesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Quản lý vai trò"
        subtitle="Quản lý các vai trò và quyền hạn trong hệ thống"
        icon={<Layers className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="roles" actionId="create">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="border-0 bg-white text-[#0066CC] hover:bg-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo Vai trò
            </Button>
          </ActionGuard>
        }
      />
      <RolesTable
        onCreateTrigger={showCreateModal}
        onCreateTriggerReset={() => setShowCreateModal(false)}
      />
    </SystemPageLayout>
  )
}
