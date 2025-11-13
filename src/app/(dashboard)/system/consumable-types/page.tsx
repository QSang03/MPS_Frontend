import { ConsumableTypeList } from './_components/ConsumableTypeList'

export default function ConsumableTypesPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý loại vật tư tiêu hao</h1>
        <p className="text-muted-foreground">Quản lý các loại vật tư tiêu hao cho thiết bị</p>
      </div>
      <ConsumableTypeList />
    </div>
  )
}
