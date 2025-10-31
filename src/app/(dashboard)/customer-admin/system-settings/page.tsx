'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSystemSettings } from '@/lib/api/system-settings'
import type { SystemSetting, SystemSettingQuery } from '@/types/system-settings'
import { SystemSettingType } from '@/types/system-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import SystemSettingFormModal from './_components/SystemSettingFormModal'
import SystemSettingDetailModal from './_components/SystemSettingDetailModal'
import { Settings, Search, Filter, Eye, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SystemSettingsPage() {
  const [query, setQuery] = useState<SystemSettingQuery>({
    page: 1,
    limit: 10,
    key: '',
    type: undefined,
    isEditable: undefined,
  })

  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system-settings', query],
    queryFn: () => getSystemSettings(query),
  })

  const handleSearch = (value: string) => {
    setQuery({ ...query, key: value, page: 1 })
  }

  const handleTypeFilter = (value: string) => {
    setQuery({
      ...query,
      type: value === 'all' ? undefined : (value as SystemSettingType),
      page: 1,
    })
  }

  const handleEditableFilter = (value: string) => {
    setQuery({
      ...query,
      isEditable: value === 'all' ? undefined : value === 'true',
      page: 1,
    })
  }

  const handleViewDetail = (setting: SystemSetting) => {
    setSelectedSetting(setting)
    setDetailModalOpen(true)
  }

  const getTypeColor = (type: SystemSettingType) => {
    switch (type) {
      case SystemSettingType.STRING:
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case SystemSettingType.NUMBER:
        return 'bg-purple-500/10 text-purple-700 border-purple-200'
      case SystemSettingType.BOOLEAN:
        return 'bg-green-500/10 text-green-700 border-green-200'
      case SystemSettingType.JSON:
        return 'bg-orange-500/10 text-orange-700 border-orange-200'
      case SystemSettingType.SECRET:
        return 'bg-red-500/10 text-red-700 border-red-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Settings className="h-8 w-8 text-blue-600" />
            Cấu hình hệ thống
          </h1>
          <p className="text-sm text-gray-500">Quản lý các cấu hình và thiết lập hệ thống</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search by key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm theo khóa</label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Nhập khóa cấu hình..."
                  value={query.key}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter by type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại cấu hình</label>
              <Select value={query.type || 'all'} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value={SystemSettingType.STRING}>STRING</SelectItem>
                  <SelectItem value={SystemSettingType.NUMBER}>NUMBER</SelectItem>
                  <SelectItem value={SystemSettingType.BOOLEAN}>BOOLEAN</SelectItem>
                  <SelectItem value={SystemSettingType.JSON}>JSON</SelectItem>
                  <SelectItem value={SystemSettingType.SECRET}>SECRET</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by editable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select
                value={query.isEditable === undefined ? 'all' : query.isEditable ? 'true' : 'false'}
                onValueChange={handleEditableFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Có thể chỉnh sửa</SelectItem>
                  <SelectItem value="false">Chỉ đọc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách cấu hình</CardTitle>
              <CardDescription>{data?.pagination.total || 0} cấu hình</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="space-y-3">
              {data.data.map((setting) => (
                <div
                  key={setting.id}
                  className="group rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-semibold">
                          {setting.key}
                        </code>
                        <Badge className={cn('shrink-0 border', getTypeColor(setting.type))}>
                          {setting.type}
                        </Badge>
                        {setting.isEditable ? (
                          <Badge className="shrink-0 border-green-200 bg-green-500/10 text-green-700">
                            Có thể chỉnh sửa
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 border-gray-200 bg-gray-500/10 text-gray-700">
                            Chỉ đọc
                          </Badge>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      )}
                      <div className="text-xs text-gray-400">
                        Giá trị:{' '}
                        <code className="rounded bg-gray-50 px-2 py-0.5 font-mono">
                          {setting.type === SystemSettingType.SECRET
                            ? '••••••••'
                            : setting.value.length > 50
                              ? setting.value.substring(0, 50) + '...'
                              : setting.value}
                        </code>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleViewDetail(setting)}
                      >
                        <Eye className="h-4 w-4" />
                        Xem
                      </Button>
                      {setting.isEditable && (
                        <SystemSettingFormModal setting={setting} onSaved={() => refetch()} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Settings className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>Không tìm thấy cấu hình nào</p>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                Trang {data.pagination.page} / {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery({ ...query, page: query.page! - 1 })}
                  disabled={query.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery({ ...query, page: query.page! + 1 })}
                  disabled={query.page === data.pagination.totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <SystemSettingDetailModal
        setting={selectedSetting}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  )
}
