export type WarehouseDocumentType =
  | 'IMPORT_FROM_SUPPLIER'
  | 'EXPORT_TO_CUSTOMER'
  | 'RETURN_FROM_CUSTOMER'

export type WarehouseDocumentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface WarehouseDocumentItem {
  id?: string
  consumableTypeId: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  notes?: string
  consumableType?: {
    id: string
    name: string
    partNumber?: string
  }
}

export interface WarehouseDocument {
  id: string
  documentNumber: string
  type: WarehouseDocumentType
  status: WarehouseDocumentStatus
  customerId?: string
  customer?: { id: string; name: string }
  purchaseRequestId?: string
  purchaseRequest?: { id: string; title: string; status?: string }
  supplierName?: string
  notes?: string
  items?: WarehouseDocumentItem[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateWarehouseDocumentDto {
  type: WarehouseDocumentType
  customerId?: string
  purchaseRequestId?: string
  supplierName?: string
  notes?: string
  items: Array<{
    consumableTypeId: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
}

export interface UpdateWarehouseDocumentStatusDto {
  status: WarehouseDocumentStatus
}

export default WarehouseDocument
