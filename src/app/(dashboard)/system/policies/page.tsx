'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PolicyWorkspace } from './_components/PolicyWorkspace'
import { PolicyListPage } from './_components/PolicyListPage'
import type { Policy } from '@/types/policies'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy)
    setActiveTab('create')
  }

  const handleCreateNew = () => {
    setEditingPolicy(null)
    setActiveTab('create')
  }

  const handlePolicyCreated = () => {
    setEditingPolicy(null)
    setActiveTab('list')
  }

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title="Quản lý Policy"
        subtitle="Tạo và quản lý các policy hệ thống"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <Button
            onClick={handleCreateNew}
            className="border-0 bg-white text-[#0066CC] hover:bg-blue-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo mới Policy
          </Button>
        }
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">Danh sách Policy</TabsTrigger>
          <TabsTrigger value="create">Tạo mới Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <PolicyListPage onEdit={handleEditPolicy} onCreate={handleCreateNew} />
        </TabsContent>

        <TabsContent value="create">
          <PolicyWorkspace initialPolicy={editingPolicy} onPolicyCreated={handlePolicyCreated} />
        </TabsContent>
      </Tabs>
    </SystemPageLayout>
  )
}
