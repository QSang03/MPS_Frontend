'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { navigationConfigService } from '@/lib/api/services/navigation-config.service'
import type { NavigationConfig, NavigationConfigQuery } from '@/types/navigation-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import NavigationConfigTable from './_components/NavigationConfigTable'
import NavigationConfigFormModal from './_components/NavigationConfigFormModal'
import NavigationConfigDetailModal from './_components/NavigationConfigDetailModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Settings, RefreshCw, Plus } from 'lucide-react'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { FilterSection } from '@/components/system/FilterSection'
import { PaginationControls } from '@/components/system/PaginationControls'
import { useLocale } from '@/components/providers/LocaleProvider'
import { toast } from 'sonner'

export default function NavigationConfigsPage() {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<NavigationConfigQuery>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [selectedConfig, setSelectedConfig] = useState<NavigationConfig | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<NavigationConfig | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['navigation-configs', query],
    queryFn: () => navigationConfigService.getAll(query),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => navigationConfigService.delete(id),
    onSuccess: () => {
      toast.success(t('navigation_config.delete_success'))
      queryClient.invalidateQueries({ queryKey: ['navigation-configs'] })
    },
    onError: (error: Error) => {
      console.error('Delete navigation config failed', error)
      toast.error(t('navigation_config.delete_error'))
    },
  })

  const handleSearch = (value: string) => {
    setQuery({ ...query, search: value, page: 1 })
  }

  const handleViewDetail = (config: NavigationConfig) => {
    setSelectedConfig(config)
    setDetailModalOpen(true)
  }

  const handleEdit = (config: NavigationConfig) => {
    setEditingConfig(config)
    setFormModalOpen(true)
  }

  const handleCreate = () => {
    setEditingConfig(null)
    setFormModalOpen(true)
  }

  const handleDelete = (config: NavigationConfig) => {
    if (confirm(t('navigation_config.confirm_delete', { name: config.name }))) {
      deleteMutation.mutate(config.id)
    }
  }

  const activeFilters = []
  if (query.search) {
    activeFilters.push({
      label: `${t('filters.search_label')}: "${query.search}"`,
      value: query.search,
      onRemove: () => handleSearch(''),
    })
  }

  const configs = data?.data || []
  const pagination = data?.pagination

  return (
    <SystemPageLayout>
      <SystemPageHeader
        title={t('navigation_config.title')}
        subtitle={t('navigation_config.description')}
        icon={<Settings className="h-6 w-6" />}
      />

      <FilterSection
        activeFilters={activeFilters}
        onReset={() => {
          setQuery({ ...query, search: '', page: 1 })
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('filters.search_placeholder')}
              value={query.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <ActionGuard pageId="navigation-configs" actionId="create">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('navigation_config.create')}
            </Button>
          </ActionGuard>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {t('common.refresh')}
          </Button>
        </div>
      </FilterSection>

      <Card>
        <CardHeader>
          <CardTitle>{t('navigation_config.list_title')}</CardTitle>
          <CardDescription>{t('navigation_config.list_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <NavigationConfigTable
                configs={configs}
                onView={handleViewDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              {pagination && (
                <PaginationControls
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(page) => setQuery({ ...query, page })}
                  onItemsPerPageChange={(limit: number) => setQuery({ ...query, limit, page: 1 })}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedConfig && (
        <NavigationConfigDetailModal
          config={selectedConfig}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />
      )}

      <NavigationConfigFormModal
        config={editingConfig}
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['navigation-configs'] })
          setFormModalOpen(false)
        }}
      />
    </SystemPageLayout>
  )
}
