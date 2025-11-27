# Warehouse Document Feature – UI Integration Guide

This document explains how the new Warehouse Document flow actually works in the backend so UI/UX teams can design the correct screens, data bindings, and state transitions.

---

## 1. Concept Overview

| Concept                      | Description                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Warehouse Document Types** | `IMPORT_FROM_SUPPLIER`, `EXPORT_TO_CUSTOMER`, `RETURN_FROM_CUSTOMER`. Each type controls required fields (supplier/customer), stock direction (IN/OUT), and automatic flows. |
| **Statuses**                 | `DRAFT` (created but not yet applied to stock), `CONFIRMED` (stock movements processed), `CANCELLED` (only possible from `DRAFT`).                                           |
| **Document Items**           | Each item links to a `consumableTypeId`, quantity, unit price, total price, optional notes, and the related consumable type metadata (name, part number).                    |
| **Relationships**            | Documents can link to `customer` (exports/returns), `purchaseRequest` (automatic exports), and are referenced by `consumable_stock_movements`.                               |

---

## 2. Data Model Cheat Sheet

### Header Fields

- `documentNumber`: generated per type/day (`WH-IMPORT-YYYYMMDD-###` etc.).
- `type`, `status`.
- `customerId`, `purchaseRequestId`, `supplierName`, `notes`, `createdBy`, `createdAt`, `updatedAt`.

### Items Array

Each item contains:

- `consumableTypeId`, `quantity`, `unitPrice`, `totalPrice`, `notes`.
- `consumableType` relation: `id`, `name`, optional `partNumber`.

### Linked Entities

- `customer`: `id`, `name`.
- `purchaseRequest`: `id`, `title`, `status`.

These fields are returned by the device service and exposed unchanged through the API Gateway responses defined in `WarehouseDocumentResponseDto`.

---

## 3. REST API (API Gateway → Device Service)

All routes live under `/warehouse-documents`, guarded by `AuthGuard` + `AbacGuard`, and forward 1:1 to the device service microservice (`{ cmd: '...' }`).

### 3.1 `POST /warehouse-documents`

- **Purpose:** Create a new document in `DRAFT`. Validation differs by type:
  - EXPORT/RETURN require `customerId`.
  - IMPORT requires `supplierName`.
  - All items must reference existing consumable types; exports also validate stock availability.
- **Body:** `CreateWarehouseDocumentDto` (items array, optional supplier/customer fields).
- **Response:** `WarehouseDocumentResponseDto`.
- **Errors:** `400` (missing type-specific fields), `404` (customer/purchaseRequest/consumableType missing), `409` (doc number uniqueness), `422` (unhandled).
- **Microservice call:** `{ cmd: 'create_warehouse_document' }`.

### 3.2 `GET /warehouse-documents`

- **Purpose:** Paginated list with filters using `GetWarehouseDocumentsDto`.
  - Filters: `type`, `status`, `customerId`, `purchaseRequestId`, search by `documentNumber`.
  - Customer context is injected automatically; tenant users only see their own data.
- **Response:** `WarehouseDocumentsResponseDto` including `pagination`.
- **Microservice call:** `{ cmd: 'get_warehouse_documents' }`.

### 3.3 `GET /warehouse-documents/:id`

- **Purpose:** Fetch a single document by ID with nested items/customer/purchaseRequest.
- **Param DTO:** `GetWarehouseDocumentDto`.
- **Microservice call:** `{ cmd: 'get_warehouse_document_by_id' }`.

### 3.4 `PATCH /warehouse-documents/:id/status`

- **Purpose:** Transition status (typically `DRAFT → CONFIRMED`, or cancel). Backend enforces:
  - Cannot update a `CANCELLED` document.
  - Cannot revert `CONFIRMED` back to `DRAFT`.
  - Confirming triggers stock updates depending on document type (see Section 4).
- **Body:** `UpdateWarehouseDocumentStatusDto`.
- **Microservice call:** `{ cmd: 'update_warehouse_document_status' }`.

### 3.5 `POST /warehouse-documents/:id/cancel`

- **Purpose:** Shortcut to cancel a draft document.
- **Microservice call:** `{ cmd: 'cancel_warehouse_document' }`.

> ⚠️ **UI note:** The responses always include `success`, `message`, and a `data` object matching `WarehouseDocumentDataDto`. Use `pagination` metadata when listing.

---

## 4. Automatic Flows Affecting UI

### 4.1 Purchase Request ORDERED → Export Document

- File: `services/operations-service/src/purchase-request/purchase-request.service.ts` (`createWarehouseDocumentForPurchaseRequest`).
- When a PR status transitions to `ORDERED`, the service:
  1. Builds a `CreateWarehouseDocumentDto` with type `EXPORT_TO_CUSTOMER`, referencing the PR items and customer.
  2. Calls `{ cmd: 'create_warehouse_document' }` via device service.
  3. Immediately confirms the document (`{ cmd: 'update_warehouse_document_status' }` with `CONFIRMED`), causing stock deductions.
- **UI impact:** Order tracking screens should reflect that stock has left the warehouse once status changes to ORDERED, even without manual action. Expose the generated `documentNumber` or link in the PR detail for traceability.

### 4.2 Bulk Stock Import → Import Documents

- File: `services/device-service/src/stock-item/stock-item.service.ts` (`bulkImportStock`).
- On successful CSV/Excel import:
  - Valid items are grouped and a `CONFIRMED` `IMPORT_FROM_SUPPLIER` document is created automatically.
  - Each stock movement `IN` references the `warehouseDocumentId`.
  - Response includes counts and error rows; UI should surface import summary + document number.

### 4.3 Return Consumables to Warehouse

- File: `services/device-service/src/consumable/consumable.service.ts` (`returnConsumablesToWarehouse`).
- When consumables are returned from customers:
  - Items grouped by consumable type.
  - A `CONFIRMED` `RETURN_FROM_CUSTOMER` document is created.
  - Stock quantities increase and consumables transfer back to the SYS customer; each movement is linked to the document.
- **UI impact:** Return workflows should highlight that returns auto-generate documents, so operations teams can audit them without manual entry.

### 4.4 Manual Draft → Confirm Flow

- `POST /warehouse-documents` always creates `DRAFT` (manual operations).
- `PATCH .../status` to `CONFIRMED` triggers:
  - IMPORT: stock `IN`, increases quantity per item.
  - EXPORT: stock `OUT`, validates availability again to prevent race conditions, optionally updates `moveOnStatus`.
  - RETURN: stock `IN`, resets consumable ownership (if used).
- Cancelling a DRAFT doesn’t touch stock.

---

## 5. UI Guidance & Layout Suggestions

### 5.1 Screens

1. **List Page**
   - Columns: `documentNumber`, `type`, `status`, `customer.name`, `supplierName`, `purchaseRequest.title`, `createdAt`.
   - Filters/pills matching `GetWarehouseDocumentsDto`.
   - Badge colors for type (Import/Export/Return) and status (Draft/Confirmed/Cancelled).

2. **Detail Page**
   - Header: number/type/status, creation info, supplier/customer info, related PR link.
   - Items table: consumable type name + part number, quantity, unit price, total.
   - Timeline / activity log (optional) showing creation, confirmation, cancellation events.
   - Action buttons conditional on status and user permissions:
     - Draft → Confirm / Cancel.
     - Confirmed → no actions (or view-only).

3. **Creation Form**
   - Stepper or dynamic section enabling/disabling supplier/customer fields based on type selection.
   - Item picker with type search, quantity, optional unit price/notes.
   - Inline validation messages reflecting backend rules (e.g. supplierName required for imports).

### 5.2 Handling Automatic Documents

- PR details should surface the export document generated at ORDERED (link to `/warehouse-documents/:id`).
- Import screens (bulk CSV uploads) should show the generated document number in the success toast.
- Return-to-warehouse flows should display the warehouse document summary after completion.

### 5.3 Error & State Handling

- Respect server-side validation messages (they specify the missing field or consumable ID).
- When confirming:
  - Disable the confirm button while awaiting response to avoid double submissions.
  - If stock is insufficient, display the backend message identifying the consumable type.
- Partial failures in bulk import return per-row errors; map row numbers/types in the UI.

### 5.4 Tenant Awareness

- Customer-specific views automatically inject `customerId`. System admins can filter by any customer via query params; ensure the UI exposes those filters only when the session has SYS permissions.

---

## 6. Reference Summary

| File                                                                             | Purpose                                                           |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `services/device-service/src/warehouse-document/warehouse-document.service.ts`   | Core CRUD + status transitions, stock effects, caching, auditing. |
| `services/api-gateway/src/warehouse-documents/warehouse-documents.controller.ts` | REST facade for UI, wraps the microservice commands.              |
| `services/operations-service/src/purchase-request/purchase-request.service.ts`   | Auto-export integration when PR status becomes ORDERED.           |
| `services/device-service/src/stock-item/stock-item.service.ts`                   | Bulk import pipeline → confirmed import document.                 |
| `services/device-service/src/consumable/consumable.service.ts`                   | Return-to-warehouse pipeline → confirmed return document.         |
| `libs/shared/src/dto/warehouse-document.dto.ts`                                  | Request DTOs for creation, filters, and status updates.           |
| `libs/shared/src/dto/response/warehouse-document-response.dto.ts`                | Response DTO shapes for list/detail views.                        |

Use this document as the canonical reference when designing UI workflows, mockups, or API clients for the warehouse management feature.
