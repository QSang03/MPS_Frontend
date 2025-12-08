'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Mail, Shield, CheckCircle2, XCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRole } from '@/constants/roles'
import { formatRelativeTime } from '@/lib/utils/formatters'

interface UserListProps {
  customerId: string
}

// Mock data
const mockUsers = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@company.com',
    fullName: 'John Doe',
    role: 'CustomerAdmin' as UserRole,
    isActive: true,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    username: 'jane.smith',
    email: 'jane.smith@company.com',
    fullName: 'Jane Smith',
    role: 'User' as UserRole,
    isActive: true,
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    username: 'bob.wilson',
    email: 'bob.wilson@company.com',
    fullName: 'Bob Wilson',
    role: 'User' as UserRole,
    isActive: false,
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const roleColors: Record<string, string> = {
  SystemAdmin: 'bg-[var(--brand-100)] text-[var(--brand-800)]',
  CustomerAdmin: 'bg-[var(--brand-50)] text-[var(--brand-800)]',
  User: 'bg-gray-100 text-gray-800',
}

export function UserList({}: UserListProps) {
  return (
    <div className="space-y-4">
      {mockUsers.map((user) => {
        const initials = user.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()

        return (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.fullName}</p>
                      <Badge className={roleColors[user.role]} variant="secondary">
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role}
                      </Badge>
                      {user.isActive ? (
                        <Badge variant="outline" className="text-[var(--color-success-600)]">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Last login: {formatRelativeTime(user.lastLogin)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit User</DropdownMenuItem>
                    <DropdownMenuItem>Reset Password</DropdownMenuItem>
                    <DropdownMenuItem>{user.isActive ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
