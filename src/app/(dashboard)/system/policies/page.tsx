'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PolicyWorkspace } from './_components/PolicyWorkspace'
import { PolicyListPage } from './_components/PolicyListPage'
import type { Policy } from '@/types/policies'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Shield, Plus } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'

export default function PoliciesPage() {
  const { t } = useLocale()
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
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('page.policies.title')}
        subtitle={t('policies.page.subtitle')}
        icon={<Shield className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="policies" actionId="create">
            <Button
              onClick={handleCreateNew}
              className="border-0 bg-white text-[var(--brand-500)] hover:bg-[var(--brand-50)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('page.policies.create')}
            </Button>
          </ActionGuard>
        }
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <TabsTrigger
              value="list"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              {t('policies.tab.list')}
            </TabsTrigger>
            <ActionGuard pageId="policies" actionId="create">
              <TabsTrigger
                value="create"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                {t('policies.tab.create')}
              </TabsTrigger>
            </ActionGuard>
          </TabsList>
        </div>

        <TabsContent value="list">
          <PolicyListPage onEdit={handleEditPolicy} onCreate={handleCreateNew} />
        </TabsContent>

        <ActionGuard pageId="policies" actionId="create">
          <TabsContent value="create">
            <PolicyWorkspace initialPolicy={editingPolicy} onPolicyCreated={handlePolicyCreated} />
          </TabsContent>
        </ActionGuard>
      </Tabs>
    </SystemPageLayout>
  )
}
