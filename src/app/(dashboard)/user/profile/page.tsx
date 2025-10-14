import { getSession } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Mail, User, Shield, Pencil } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getSession()

  const initials = session!.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{session!.username}</h3>
              <p className="text-muted-foreground text-sm">{session!.email}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800" variant="secondary">
              <Shield className="mr-1 h-3 w-3" />
              {session!.role}
            </Badge>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Username</p>
                <p className="font-medium">{session!.username}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Email</p>
                <p className="font-medium">{session!.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Shield className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Role</p>
                <p className="font-medium">{session!.role}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <User className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Customer ID</p>
                <p className="font-mono text-sm">{session!.customerId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-muted-foreground text-sm">Last changed: Never (demo account)</p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-muted-foreground text-sm">Add an extra layer of security</p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
