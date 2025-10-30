import { CustomerList } from './_components/CustomerList'

export default function CustomersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Khách hàng</h1>
        <p className="text-muted-foreground">Tạo, chỉnh sửa và quản lý các khách hàng</p>
      </div>
      <CustomerList />
    </div>
  )
}
