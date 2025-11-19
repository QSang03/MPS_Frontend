import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ServiceRequestsTable } from './_components/ServiceRequestsTable'
import { PurchaseRequestsTable } from './_components/PurchaseRequestsTable'

export const metadata = {
  title: 'Yêu cầu khách hàng',
}

export const dynamic = 'force-dynamic'

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Quản trị yêu cầu khách hàng</h1>
        <p className="text-muted-foreground">
          Theo dõi và xử lý nhanh các yêu cầu bảo trì & mua vật tư.
        </p>
      </div>

      <Tabs defaultValue="service" className="space-y-4">
        <TabsList>
          <TabsTrigger value="service">Service Request</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Request</TabsTrigger>
        </TabsList>

        <TabsContent value="service" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu bảo trì</CardTitle>
              <CardDescription>Danh sách và trạng thái xử lý tại khách hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceRequestsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu mua hàng</CardTitle>
              <CardDescription>Quản lý vòng đời yêu cầu vật tư tiêu hao</CardDescription>
            </CardHeader>
            <CardContent>
              <PurchaseRequestsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
