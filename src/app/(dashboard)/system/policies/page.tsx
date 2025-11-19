'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PolicyWorkspace } from './_components/PolicyWorkspace'
import { PolicyListPage } from './_components/PolicyListPage'
import type { Policy } from '@/types/policies'

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
    <div className="p-4">
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
    </div>
  )
}
