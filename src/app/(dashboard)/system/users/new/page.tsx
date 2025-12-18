import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserForm } from '../_components/UserForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function UserFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export default async function NewUserPage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add User</h1>
        <p className="text-muted-foreground">Create a new user account in the organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Fill in detailed information to create a user account</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UserFormSkeleton />}>
            <UserForm customerId={session!.customerId} mode="create" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
