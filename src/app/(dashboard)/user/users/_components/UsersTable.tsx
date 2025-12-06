'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Calendar,
  RotateCcw,
  Users,
  RefreshCw,
  Filter,
  UserCog,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils/formatters'
import { EditUserModal } from './EditUserModal'
import { UserFormModal } from './UserFormModal'
import type { User, UserFilters, UserPagination, UserRole, UsersResponse } from '@/types/users'
import type { Customer } from '@/types/models/customer'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function UsersTable() {
  const { t } = useLocale()
  const { can } = useActionPermission('users')
  const canUpdate = can('update')
  const canDelete = can('delete')

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [filters, setFilters] = useState<UserFilters>(() => ({
    search: searchParams.get('search') || '',
    roleId: searchParams.get('roleId') || 'all',
    departmentId: searchParams.get('departmentId') || 'all',
    status: 'all',
    customerId: searchParams.get('customerId') || 'all',
  }))

  const [pagination, setPagination] = useState<UserPagination>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    total: 0,
    totalPages: 1,
  })

  const [searchInput, setSearchInput] = useState<string>(filters.search)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const queryClient = useQueryClient()

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users', pagination.page, pagination.limit, filters],
    queryFn: () =>
      usersClientService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        roleId: filters.roleId !== 'all' ? filters.roleId : undefined,
        departmentId: filters.departmentId !== 'all' ? filters.departmentId : undefined,
        customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
      }),
  })

  const rolesPerm = useActionPermission('roles')
  const customersPerm = useActionPermission('customers')

  const canReadRoles = rolesPerm.can('read')
  const canReadCustomers = customersPerm.can('read')

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await rolesClientService.getRoles()).data,
    enabled: canReadRoles,
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await customersClientService.getAll()).data,
    enabled: canReadCustomers,
  })

  const users = usersData?.data ?? []

  useEffect(() => {
    let t: number | undefined
    if (usersData?.pagination) {
      t = window.setTimeout(() => {
        setPagination({
          page: usersData.pagination.page,
          limit: usersData.pagination.limit,
          total: usersData.pagination.total,
          totalPages: usersData.pagination.totalPages,
        })
      }, 0)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [usersData])

  const availableCustomerCodes = useMemo(
    () => (customers || []).map((c: Customer) => (c.code as string) || c.id),
    [customers]
  )

  const customerCodeToId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of customers || []) {
      const code = ((c as Customer).code as string) || c.id
      if (code && (c as Customer).id && !map[code]) map[code] = (c as Customer).id
    }
    return map
  }, [customers])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.roleId && filters.roleId !== 'all') params.set('roleId', filters.roleId)
    if (filters.departmentId && filters.departmentId !== 'all')
      params.set('departmentId', filters.departmentId)
    if (filters.customerId && filters.customerId !== 'all')
      params.set('customerId', filters.customerId)
    if (pagination.page > 1) params.set('page', pagination.page.toString())
    if (pagination.limit !== 10) params.set('limit', pagination.limit.toString())
    const queryString = params.toString()
    const newURL = queryString ? `${pathname}?${queryString}` : pathname
    if (typeof window !== 'undefined') {
      const currentQS = window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : window.location.search
      if (currentQS !== queryString) router.replace(newURL, { scroll: false })
    }
  }, [filters, pagination, pathname, router])

  useEffect(() => {
    const handle = setTimeout(() => setFilters((prev) => ({ ...prev, search: searchInput })), 700)
    return () => clearTimeout(handle)
  }, [searchInput])

  const handleUserUpdated = (updatedUser: User) => {
    try {
      queryClient.setQueryData(
        ['users', pagination.page, pagination.limit, filters],
        (old: UsersResponse | undefined | null) => {
          if (!old) return old
          const copy: UsersResponse = { ...old }
          if (Array.isArray(copy.data)) {
            copy.data = copy.data.map((u) =>
              u.id === updatedUser.id ? { ...u, ...updatedUser } : u
            )
          }
          return copy
        }
      )
    } catch {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }

    setIsEditModalOpen(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }))
  }

  const getRoleBadgeVariant = (roleName?: string) => {
    switch (roleName) {
      case 'super-admin':
        return 'destructive'
      case 'admin':
        return 'warning'
      case 'manager':
        return 'info'
      case 'developer':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const paginationInfo = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const isLoading = isLoadingUsers || isLoadingRoles || isLoadingCustomers

  if (isLoading) {
    return <LoadingState text={t('loading.users')} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.users.title')}
        subtitle={t('page.users.subtitle')}
        icon={<Users className="h-6 w-6 text-black dark:text-white" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchUsers()}
              className="border-white/20 bg-white/10 text-black hover:bg-white/20 dark:text-white"
              title={t('button.refresh')}
            >
              <RefreshCw className={`${isFetchingUsers ? 'animate-spin' : ''} h-5 w-5`} />
            </Button>
            <ActionGuard pageId="users" actionId="create">
              <UserFormModal
                customerId={
                  filters.customerId && filters.customerId !== 'all' ? filters.customerId : ''
                }
              />
            </ActionGuard>
          </div>
        }
      />

      {/* FILTER CARD */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-black dark:text-white" />
            <CardTitle className="text-lg">{t('filters.general')}</CardTitle>
          </div>
          <CardDescription>{t('filters.user_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('filters.search_label')}
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t('filters.search_placeholder_users')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Role (hidden if no permission) */}
            {canReadRoles ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('filters.role_label')}
                </label>
                {isMounted ? (
                  <Select
                    value={filters.roleId}
                    onValueChange={(v) => setFilters((p) => ({ ...p, roleId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('filters.select_role_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all_roles')}</SelectItem>
                      {roles.map((role: UserRole) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-muted/20 h-10 w-full rounded-md border" />
                )}
              </div>
            ) : null}

            {/* Customer (hidden if no permission) */}
            {canReadCustomers ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('filters.customer_label')}
                </label>
                {isMounted ? (
                  <Select
                    value={filters.customerId}
                    onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('filters.select_customer_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all_customers')}</SelectItem>
                      {availableCustomerCodes.map((code) => (
                        <SelectItem key={code} value={customerCodeToId[code] || code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-muted/20 h-10 w-full rounded-md border" />
                )}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    roleId: 'all',
                    departmentId: 'all',
                    status: 'all',
                    customerId: 'all',
                  })
                  setSearchInput('')
                  router.replace(pathname, { scroll: false })
                }}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> {t('button.reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USERS TABLE CARD */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-black dark:text-white" />
                {t('page.users.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('pagination.showing_of')
                  .replace('{current}', String(users.length))
                  .replace('{total}', String(paginationInfo.total))}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-black dark:text-white" />
                      {t('user')}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-black dark:text-white" />
                      {t('nav.customers')}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-black dark:text-white" />
                      {t('nav.roles')}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-black dark:text-white" />
                      {t('table.created_at')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px] text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <EmptyState
                        title={t('empty.users.title')}
                        description={t('empty.users.description')}
                        action={{
                          label: t('page.users.create'),
                          onClick: () => document.getElementById('create-user-trigger')?.click(),
                        }}
                        className="border-none bg-transparent py-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id} className="cursor-pointer">
                      <TableCell className="text-muted-foreground text-center">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.customer?.code ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700"
                          >
                            {user.customer.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge
                            status={user.role?.name || 'Unknown'}
                            variant={getRoleBadgeVariant(user.role?.name)}
                          />
                          <div className="text-muted-foreground pl-1 text-xs">
                            Level {user.role?.level || '—'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('button.edit')}
                              </DropdownMenuItem>
                            )}
                            <ConfirmDialog
                              title={t('user.reset_password')}
                              description={t('user.reset_password_confirmation').replace(
                                '{email}',
                                user.email
                              )}
                              confirmLabel={t('confirm.reset')}
                              cancelLabel={t('cancel')}
                              onConfirm={async () => {
                                try {
                                  await usersClientService.resetPassword(user.id)
                                  await queryClient.invalidateQueries({ queryKey: ['users'] })
                                  toast.success(t('user.reset_password_success'))
                                } catch (err) {
                                  console.error('Reset user password error', err)
                                  toast.error(t('user.reset_password_error'))
                                }
                              }}
                              trigger={
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  {t('user.reset_password')}
                                </DropdownMenuItem>
                              }
                            />

                            {canDelete && (
                              <DeleteDialog
                                title={t('user.delete')}
                                description={t('user.delete_confirmation').replace(
                                  '{email}',
                                  user.email
                                )}
                                onConfirm={async () => {
                                  try {
                                    await usersClientService.deleteUser(user.id)
                                    await queryClient.invalidateQueries({ queryKey: ['users'] })
                                    toast.success(t('user.delete_success'))
                                  } catch (err) {
                                    console.error('Delete user error', err)
                                    toast.error(t('user.delete_error'))
                                  }
                                }}
                                trigger={
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('button.delete')}
                                  </DropdownMenuItem>
                                }
                              />
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {users.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                {t('pagination.showing')}{' '}
                <span className="text-foreground font-medium">{users.length}</span> /{' '}
                <span className="text-foreground font-medium">{paginationInfo.total}</span>{' '}
                {t('page.users.title')}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  {t('pagination.previous')}
                </Button>

                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium">{pagination.page}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>{paginationInfo.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= paginationInfo.totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
        customerCodes={availableCustomerCodes}
        customerCodeToId={customerCodeToId}
      />
    </div>
  )
}
