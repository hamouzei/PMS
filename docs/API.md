# API Documentation

## AFRICOM Technologies — Property Automation System (PAS)

| Field | Value |
|---|---|
| **Base URL** | `http://localhost:5049/api` |
| **Data Format** | JSON (`application/json`) |
| **Authentication** | JWT Bearer Token (`Authorization: Bearer <token>`) |
| **Interactive Docs** | Swagger UI at `http://localhost:5049/swagger` (development only) |

---

## Table of Contents

- [Authentication](#1-authentication-apiauth)
- [Admin](#2-admin-apiadmin)
- [Master Data](#3-master-data-apimaster-data)
- [Safety Boxes](#4-safety-boxes-apisafety-boxes)
- [Stock Control](#5-stock-control-apistock)
- [Store Requests](#6-store-requests-apistore-requests)
- [Purchase Requests](#7-purchase-requests-apipurchase-requests)
- [Receiving](#8-receiving-apireceiving)
- [Inspection](#9-inspection-apiinspection)
- [Issuing](#10-issuing-apiissuing)
- [Custody](#11-custody-apicustody)
- [Returns](#12-returns-apireturns)
- [Transfers](#13-transfers-apitransfers)
- [Handovers](#14-handovers-apihandovers)
- [Disposal](#15-disposal-apidisposal)
- [Annual Inventory](#16-annual-inventory-apiannual-inventory)
- [Compliance](#17-compliance-apicompliance)
- [Reports](#18-reports-apireports)
- [Common Models](#common-models)
- [Error Responses](#error-responses)

---

## Common Response Wrapper

### Paginated Response

All list endpoints that support pagination return a `PagedResult<T>`:

```json
{
  "items": [ ... ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 150
}
```

### Document Result

Workflow creation endpoints return:

```json
{
  "id": "guid",
  "number": "SR-2026-00001",
  "status": "Submitted"
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`

Authenticate a user and receive JWT + refresh tokens.

**Authorization:** Public (AllowAnonymous)

**Request Body:**

```json
{
  "employeeId": "PAS-ADMIN",
  "userName": "admin",
  "password": "Pass@123"
}
```

**Success Response (200):**

```json
{
  "scheme": "Bearer",
  "employeeId": "PAS-ADMIN",
  "userName": "admin",
  "role": "PropertyAdmin",
  "token": "eyJhbGciOi...",
  "refreshToken": "a1b2c3d4-...",
  "refreshTokenExpiresAt": "2026-08-29T01:00:00Z",
  "requiredHeaders": ["Authorization: Bearer <token>"]
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Invalid credentials, inactive user |
| 401 | Account locked (shows unlock time) |

**Business Rules:**
- Account lockout after **4 failed consecutive attempts** (30-minute lockout)
- Role is derived from database, not from client input
- All login attempts are recorded in audit trail

---

### `POST /api/auth/refresh`

Refresh an expired access token using a valid refresh token.

**Authorization:** Public (AllowAnonymous)

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4-..."
}
```

**Success Response (200):** Same structure as login response with new tokens (refresh token is rotated).

**Error:** 401 if token is invalid or expired.

---

### `GET /api/auth/me`

Get the current authenticated user's claims.

**Authorization:** Any authenticated user

**Response (200):**

```json
{
  "userName": "admin",
  "userId": "guid",
  "employeeId": "PAS-ADMIN",
  "roles": ["PropertyAdmin"]
}
```

---

### `GET /api/auth/roles`

Get all available user role names.

**Authorization:** Any authenticated user

**Response (200):**

```json
["Employee", "PropertyAdmin", "Storekeeper", ...]
```

---

## 2. Admin (`/api/admin`)

**Default Authorization:** PropertyAdmin only

### `PUT /api/admin/users/{id}`

Update user details.

**Request Body:**

```json
{
  "fullName": "Updated Name",
  "role": "Storekeeper",
  "department": "Logistics",
  "division": "Operations",
  "location": "HO",
  "title": "Senior Storekeeper",
  "isActive": true
}
```

> All fields are optional — only provided fields are updated.

**Response:** 200 with updated user, or 404 if not found.

---

### `POST /api/admin/users/{id}/deactivate`

Deactivate a user account. No request body required.

---

### `POST /api/admin/users/{id}/activate`

Activate a user account. No request body required.

---

### `POST /api/admin/users/{id}/reset-password`

Reset user password and unlock account.

**Request Body:**

```json
{
  "newPassword": "NewPass@456"
}
```

---

### `POST /api/admin/budgets`

Create a budget allocation.

**Request Body:**

```json
{
  "fiscalYear": 2026,
  "department": "IT",
  "division": "Infrastructure",
  "allocatedAmount": 500000.00
}
```

---

### `GET /api/admin/budgets?fiscalYear={year}`

List budget allocations, optionally filtered by fiscal year.

---

### `POST /api/admin/seed`

Seed demo data into the database.

**Response (200):** `{ "message": "Seed data is ready." }`

---

## 3. Master Data (`/api/master-data`)

**Default Authorization:** Authenticated users (role-specific per endpoint)

### Categories

#### `GET /api/master-data/categories`

List all categories with hierarchy.

**Roles:** RequestActors, AdminOrStorekeeper, ReportViewer

#### `POST /api/master-data/categories`

Create a new category.

**Roles:** AdminOrStorekeeper

**Request Body:**

```json
{
  "name": "Fixed Assets",
  "description": "Durable property items",
  "parentCategoryId": null
}
```

#### `PUT /api/master-data/categories/{id}`

Update an existing category. Request body same as create.

**Roles:** AdminOrStorekeeper

---

### Items

#### `GET /api/master-data/items`

List all item masters.

**Roles:** RequestActors, AdminOrStorekeeper, ReportViewer

#### `GET /api/master-data/items/{id}`

Get item by ID with category and custom field values.

**Roles:** RequestActors, AdminOrStorekeeper, ReportViewer

#### `POST /api/master-data/items`

Create a new item.

**Roles:** AdminOrStorekeeper

**Request Body:**

```json
{
  "sku": "FA-LAP-001",
  "itemName": "Laptop Computer",
  "description": "15-inch business laptop",
  "categoryId": "guid",
  "propertyType": 1,
  "unitOfMeasure": "Each",
  "requiresInspection": true,
  "minStockLevel": 5,
  "unitCost": 45000.00
}
```

> `propertyType`: 1 = FixedAsset, 2 = Consumable

#### `PUT /api/master-data/items/{id}`

Update an existing item. Request body same as create.

**Roles:** AdminOrStorekeeper

---

### Search / Autocomplete

#### `GET /api/master-data/items/search?q={query}&max={25}`

Search items by name or SKU.

**Roles:** RequestActors, AdminOrStorekeeper

**Response:** Array of `{ id, sku, itemName, unitOfMeasure, propertyType }`

#### `GET /api/master-data/categories/search?q={query}&max={25}`

Search categories by name.

**Roles:** RequestActors, AdminOrStorekeeper

#### `GET /api/master-data/users/search?q={query}&max={25}`

Search users by full name or employee ID.

**Roles:** Any authenticated user

#### `GET /api/master-data/warehouses/search?q={query}&max={25}`

Search warehouses by name or location code.

**Roles:** Any authenticated user

---

### Warehouses & Shelves

#### `GET /api/master-data/warehouses`

List all warehouses.

#### `POST /api/master-data/warehouses`

Create a warehouse.

**Request Body:**

```json
{
  "warehouseName": "Head Office Central Store",
  "locationCode": "AFRICOM-HO",
  "locationType": "HO",
  "address": "Addis Ababa, Ethiopia",
  "parentWarehouseId": null
}
```

#### `GET /api/master-data/shelves`

List all shelf locations.

#### `POST /api/master-data/shelves`

Create a shelf location.

**Request Body:**

```json
{
  "warehouseId": "guid",
  "aisle": "A",
  "rack": "1",
  "shelfNumber": "S01",
  "bin": "B1",
  "qrCodeValue": "QR-AFRICOM-HO-A1-S01-B1",
  "capacity": 100.00
}
```

---

### Suppliers

#### `GET /api/master-data/suppliers`

**Roles:** AdminOrStorekeeper, ProcurementOfficer

#### `POST /api/master-data/suppliers`

**Roles:** AdminOrStorekeeper, ProcurementOfficer

**Request Body:**

```json
{
  "supplierName": "Demo Supplier PLC",
  "contactPerson": "Abebe Kebede",
  "tinNumber": "0012345678",
  "phoneNumber": "+251911223344",
  "email": "supplier@example.com"
}
```

---

### Users (Master Data)

#### `GET /api/master-data/users`

List all users.

**Roles:** PropertyAdmin

#### `POST /api/master-data/users`

Create a new user.

**Roles:** PropertyAdmin

**Request Body:**

```json
{
  "employeeId": "PAS-NEW",
  "userName": "newuser",
  "fullName": "New User",
  "password": "SecurePass@123",
  "role": 4,
  "department": "IT",
  "division": "Support",
  "location": "HO",
  "title": "Staff"
}
```

> `role`: 1=Employee, 2=PropertyAdmin, 3=Storekeeper, 4=RequisitioningStaff, 5=DepartmentManager, 6=Inspector, 7=ComplianceOfficer, 8=ReportViewer, 9=ProcurementOfficer, 10=FinanceOfficer

---

### Custom Property Fields

#### `GET /api/master-data/property-fields`

**Roles:** AdminOrStorekeeper

#### `POST /api/master-data/property-fields`

**Roles:** PropertyAdmin

**Request Body:**

```json
{
  "fieldName": "Warranty Expiry",
  "fieldType": 3,
  "isRequired": false,
  "applicablePropertyType": 1,
  "displayOrder": 1,
  "options": null
}
```

> `fieldType`: 1=Text, 2=Number, 3=Date, 4=Boolean, 5=Selection

#### `POST /api/master-data/property-field-values`

**Roles:** AdminOrStorekeeper

**Request Body:**

```json
{
  "propertyFieldId": "guid",
  "itemId": "guid",
  "value": "2027-12-31"
}
```

---

## 4. Safety Boxes (`/api/safety-boxes`)

### `GET /api/safety-boxes`

List all safety boxes with active shelf count.

**Roles:** StockActors

### `GET /api/safety-boxes/{id}`

Get safety box detail with all shelves.

**Roles:** StockActors

### `POST /api/safety-boxes`

Create a safety box.

**Roles:** AdminOrStorekeeper

**Request Body:**

```json
{
  "boxNumber": "SB-001",
  "warehouseId": "guid",
  "description": "Main safety box",
  "category": "Electronics",
  "totalShelves": 5
}
```

### `POST /api/safety-boxes/shelves`

Create a shelf within a safety box.

**Roles:** AdminOrStorekeeper

**Request Body:**

```json
{
  "safetyBoxId": "guid",
  "shelfLabel": "Shelf A",
  "weightCapacity": 50.00,
  "volumeCapacity": 100.00,
  "shelfLocationId": "guid"
}
```

### `GET /api/safety-boxes/dashboard`

Safety box monitoring dashboard — per-box aggregated stock data.

**Roles:** StockActors

**Response:**

```json
[
  {
    "id": "guid",
    "boxNumber": "SB-001",
    "description": "Main safety box",
    "category": "Electronics",
    "totalShelves": 3,
    "totalItems": 150,
    "totalReserved": 10,
    "totalAvailable": 140,
    "totalDiscrepancy": 0
  }
]
```

---

## 5. Stock Control (`/api/stock`)

**Default Authorization:** StockActors, ReportActors

### `GET /api/stock/balances`

Get inventory stock balances.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `warehouseId` | guid | Filter by warehouse |
| `itemId` | guid | Filter by item |
| `propertyType` | string | "FixedAsset" or "Consumable" |
| `pageNumber` | int | Default: 1 |
| `pageSize` | int | Default: 50 |

**Response:** Paginated list of stock balances with item name, SKU, quantities, shelf, and warehouse.

### `GET /api/stock/availability/{itemId}`

Get item availability aggregated across all shelves.

**Response:**

```json
{
  "itemId": "guid",
  "currentQuantity": 100,
  "reservedQuantity": 10,
  "availableQuantity": 90,
  "shelves": [
    {
      "id": "guid",
      "shelfId": "guid",
      "currentQuantity": 60,
      "reservedQuantity": 5,
      "availableQuantity": 55,
      "shelfNumber": "S01",
      "warehouse": "HO Central Store"
    }
  ]
}
```

### `GET /api/stock/low-stock`

Get items where available quantity is at or below the minimum stock level.

### `GET /api/stock/ledger`

Get stock movement ledger.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `itemId` | guid | Filter by item |
| `from` | datetime | Start date |
| `to` | datetime | End date |
| `pageNumber` | int | Default: 1 |
| `pageSize` | int | Default: 50 |

### `POST /api/stock/opening-balance`

Register opening balance for an item at a shelf location.

**Roles:** StockActors

**Request Body:**

```json
{
  "itemId": "guid",
  "shelfId": "guid",
  "quantity": 100,
  "unitCost": 25.50,
  "reason": "Initial stock setup"
}
```

### `POST /api/stock/adjustments`

Perform a stock adjustment (positive or negative).

**Roles:** StockActors

**Request Body:**

```json
{
  "itemId": "guid",
  "shelfId": "guid",
  "quantityChange": -5,
  "reason": "Damaged items removed"
}
```

### `GET /api/stock/generate-tag/{warehouseId}/{propertyType}`

Generate an ECX-format tag number for a given warehouse and property type.

**Roles:** StockActors

**Response:** `{ "tagNumber": "AFRICOM-HO-1-01-00001" }`

---

## 6. Store Requests (`/api/store-requests`)

**Default Authorization:** RequestActors, StockActors

### `GET /api/store-requests`

List store requests with optional filters.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `pageNumber` | int | Default: 1 |
| `pageSize` | int | Default: 20 |
| `status` | string | WorkflowStatus name (e.g., "Submitted", "Approved") |
| `requesterId` | guid | Filter by requester |

### `GET /api/store-requests/{id}`

Get store request by ID with line items, requester, and approver.

### `POST /api/store-requests`

Create a new store request.

**Request Body:**

```json
{
  "requesterId": "guid",
  "requestType": 1,
  "reason": "Office supplies needed",
  "details": [
    {
      "itemId": "guid",
      "shelfId": "guid",
      "quantity": 10,
      "unitCost": 25.50,
      "tagNumber": null,
      "serialNumber": null,
      "remarks": "Urgent"
    }
  ]
}
```

> `requestType`: 1=Budgeted, 2=Replacement, 3=Emergency, 4=Other

**Response (201):** `DocumentResult` with generated SR number.

### `POST /api/store-requests/{id}/approve`

Approve a store request. Reserves stock.

**Roles:** Approvers (DepartmentManager, PropertyAdmin)

**Request Body:**

```json
{
  "actorId": "guid",
  "remark": "Approved for distribution"
}
```

### `POST /api/store-requests/{id}/reject`

Reject a store request.

**Roles:** Approvers

**Request Body:**

```json
{
  "actorId": "guid",
  "reason": "Insufficient budget"
}
```

---

## 7. Purchase Requests (`/api/purchase-requests`)

**Default Authorization:** RequestActors, ProcurementOfficer

### `GET /api/purchase-requests`

List purchase requests with optional status and requester filters. Paginated.

### `GET /api/purchase-requests/{id}`

Get purchase request by ID with line items.

### `POST /api/purchase-requests`

Create a purchase requisition.

**Request Body:**

```json
{
  "requesterId": "guid",
  "requestType": 1,
  "justification": "Need new laptops for IT dept",
  "estimatedBudget": 250000.00,
  "details": [
    {
      "itemId": "guid",
      "shelfId": null,
      "quantity": 5,
      "unitCost": 50000.00,
      "tagNumber": null,
      "serialNumber": null,
      "remarks": null
    }
  ]
}
```

**Response (201):** `DocumentResult` with generated PR number.

### `POST /api/purchase-requests/{id}/approve`

**Roles:** Approvers, ProcurementOfficer

### `POST /api/purchase-requests/{id}/reject`

**Roles:** Approvers, ProcurementOfficer

**Request Body:**

```json
{
  "actorId": "guid",
  "reason": "Budget exceeded"
}
```

---

## 8. Receiving (`/api/receiving`)

**Default Authorization:** StockActors

### `GET /api/receiving`

List receiving notes with optional status filter. Paginated.

### `GET /api/receiving/{id}`

Get receiving note by ID with line items, supplier, inspection, and approver.

### `POST /api/receiving`

Create a new receiving note (GRN, and optionally FARN for fixed assets).

**Request Body:**

```json
{
  "supplierId": "guid",
  "warehouseId": "guid",
  "receivedById": "guid",
  "purchaseRequestId": "guid",
  "invoiceNumber": "INV-001",
  "purchaseOrderNumber": "PO-001",
  "storeRequestNumber": null,
  "tenderReferenceNumber": null,
  "notes": "Goods received in good condition",
  "details": [
    {
      "itemId": "guid",
      "shelfId": "guid",
      "quantity": 10,
      "unitCost": 45000.00,
      "tagNumber": "AFRICOM-HO-1-01-00001",
      "serialNumber": "SN-12345",
      "remarks": null
    }
  ],
  "attachments": [
    {
      "fileName": "invoice.pdf",
      "contentType": "application/pdf",
      "storagePath": "/uploads/invoice.pdf",
      "uploadedById": "guid"
    }
  ]
}
```

**Response (201):** `DocumentResult` with generated GRN (and FARN) number.

### `POST /api/receiving/{id}/inspect`

Record inspection result for a receiving note.

**Roles:** StockActors, Inspector

**Request Body:**

```json
{
  "receivingNoteId": "guid",
  "inspectorId": "guid",
  "isPassed": true,
  "deviationNotes": null,
  "attachments": []
}
```

> Note: `receivingNoteId` in the body is overridden by the route `{id}`.

### `POST /api/receiving/{id}/release-to-stock`

Release received goods to stock (after inspection if required).

**Request Body:**

```json
{
  "receivingNoteId": "guid",
  "releasedById": "guid"
}
```

---

## 9. Inspection (`/api/inspection`)

**Default Authorization:** Inspector, StockActors

### `GET /api/inspection`

List all inspection logs. Paginated.

**Response items include:** id, isPassed, deviationNotes, inspectionDate, inspector name, GRN number.

### `POST /api/inspection`

Record an inspection (alternative to the receiving route).

**Request Body:**

```json
{
  "receivingNoteId": "guid",
  "inspectorId": "guid",
  "isPassed": false,
  "deviationNotes": "Items had visible damage",
  "attachments": []
}
```

---

## 10. Issuing (`/api/issuing`)

**Default Authorization:** StockActors

### `GET /api/issuing/vouchers`

List all store issue vouchers. Paginated.

### `GET /api/issuing/vouchers/{id}`

Get voucher by ID with line items.

### `POST /api/issuing`

Issue stock against an approved store request. Creates SIV (and FAIV for fixed assets).

**Request Body:**

```json
{
  "serviceRequestId": "guid",
  "issuedById": "guid",
  "recipientSignature": "Signature123"
}
```

**Business Rules:**
- Deducts stock from inventory
- Creates `UserCustody` records for the requester
- Generates SIV number (and FAIV for fixed assets)

---

## 11. Custody (`/api/custody`)

**Default Authorization:** RequestActors, StockActors, ReportActors

### `GET /api/custody`

List user custody records (only those with quantity > 0).

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `custodianId` | guid | Filter by custodian |
| `itemId` | guid | Filter by item |
| `pageNumber` | int | Default: 1 |
| `pageSize` | int | Default: 50 |

**Response items include:** id, quantity, tagNumber, serialNumber, sourceDocumentNumber, custodian name, custodianId, item name, itemId.

---

## 12. Returns (`/api/returns`)

**Default Authorization:** RequestActors, StockActors

### `GET /api/returns`

List property returns with optional status filter. Paginated.

### `GET /api/returns/{id}`

Get return by ID with line items and all user references.

### `POST /api/returns`

Create a property return (RMRN).

**Request Body:**

```json
{
  "returnedById": "guid",
  "reason": "No longer needed",
  "details": [
    {
      "itemId": "guid",
      "shelfId": "guid",
      "quantity": 1,
      "unitCost": 45000.00,
      "tagNumber": "AFRICOM-HO-1-01-00001",
      "serialNumber": "SN-12345",
      "condition": 2
    }
  ],
  "attachments": []
}
```

> `condition`: 1=New, 2=FunctionalUsed, 3=Damaged, 4=Obsolete, 5=NonFunctional

**Response (201):** `DocumentResult` with generated RMRN number.

### `POST /api/returns/{id}/approve`

Approve a return — adds stock back, updates custody.

**Roles:** StockActors, Approvers

---

## 13. Transfers (`/api/transfers`)

**Default Authorization:** RequestActors, StockActors

### `GET /api/transfers`

List property transfers with optional status filter. Paginated.

### `GET /api/transfers/{id}`

Get transfer by ID with line items.

### `POST /api/transfers`

Create a property transfer (RMTN).

**Request Body:**

```json
{
  "fromCustodianId": "guid",
  "toCustodianId": "guid",
  "reason": "Staff reassignment",
  "details": [
    {
      "itemId": "guid",
      "quantity": 1,
      "tagNumber": "AFRICOM-HO-1-01-00001",
      "serialNumber": "SN-12345"
    }
  ],
  "attachments": []
}
```

**Response (201):** `DocumentResult` with generated RMTN number.

### `POST /api/transfers/{id}/approve`

Approve a transfer — moves custody from source to destination.

**Roles:** Approvers, StockActors

---

## 14. Handovers (`/api/handovers`)

**Default Authorization:** Authenticated (role-specific per endpoint)

### `GET /api/handovers`

List property handovers.

**Roles:** HandoverActors (PropertyAdmin, DepartmentManager, Storekeeper)

**Query Parameters:** pageNumber, pageSize, status

### `GET /api/handovers/{id}`

Get handover by ID with line items.

**Roles:** HandoverActors

### `POST /api/handovers`

Create a property handover.

**Roles:** HandoverActors

**Request Body:**

```json
{
  "handoverFromId": "guid",
  "handoverToId": "guid",
  "purpose": "Staff transfer between branches",
  "fromLocation": "HO",
  "toLocation": "Branch-01",
  "remarks": "Items in good condition",
  "details": [
    {
      "itemId": "guid",
      "quantity": 1,
      "tagNumber": "AFRICOM-HO-1-01-00001",
      "serialNumber": "SN-12345",
      "farnNumber": "FARN-2026-00001",
      "rmrnNumber": null,
      "faivNumber": "FAIV-2026-00001"
    }
  ],
  "attachments": []
}
```

**Response (201):** `DocumentResult` with generated handover number.

### `POST /api/handovers/{id}/approve`

**Roles:** Approvers

---

## 15. Disposal (`/api/disposal`)

**Default Authorization:** ComplianceOfficer, StockActors

### `GET /api/disposal`

List disposal records with optional status filter. Paginated.

### `GET /api/disposal/{id}`

Get disposal record by ID.

### `POST /api/disposal`

Create a disposal record.

**Request Body:**

```json
{
  "itemId": "guid",
  "shelfId": "guid",
  "custodianId": "guid",
  "quantity": 3,
  "condition": 4,
  "disposalMethod": 1,
  "notes": "Items beyond repair",
  "attachments": []
}
```

> `condition`: 1=New, 2=FunctionalUsed, 3=Damaged, 4=Obsolete, 5=NonFunctional
> `disposalMethod`: 1=Auction, 2=Tendering, 3=Scrapping, 4=Other

**Response (201):** `DocumentResult` with generated disposal number.

### `POST /api/disposal/{id}/approve`

Approve disposal — deducts stock.

---

## 16. Annual Inventory (`/api/annual-inventory`)

**Default Authorization:** StockActors, ReportActors

### `GET /api/annual-inventory`

List annual inventories with optional filters.

**Query Parameters:** fiscalYear, location, pageNumber, pageSize

### `GET /api/annual-inventory/{id}`

Get annual inventory by ID with count lines.

### `POST /api/annual-inventory`

Create an annual physical inventory count.

**Request Body:**

```json
{
  "fiscalYear": 2026,
  "location": "HO",
  "countedById": "guid",
  "lines": [
    {
      "itemId": "guid",
      "shelfId": "guid",
      "expectedQuantity": 100,
      "countedQuantity": 98,
      "notes": "2 items missing"
    }
  ]
}
```

**Response (201):** `DocumentResult` with generated inventory number.

### `POST /api/annual-inventory/{id}/complete`

Mark inventory as complete/closed.

**Request Body:**

```json
{
  "actorId": "guid",
  "remark": "Count verified and approved"
}
```

---

## 17. Compliance (`/api/compliance`)

**Default Authorization:** ComplianceActors (ComplianceOfficer, PropertyAdmin)

### `GET /api/compliance`

List compliance records. Paginated.

### `GET /api/compliance/{id}`

Get compliance record by ID.

### `POST /api/compliance`

Create a compliance review record.

**Request Body:**

```json
{
  "inventoryId": "guid",
  "reviewedById": "guid",
  "findings": "All items accounted for",
  "recommendations": "Continue current procedures",
  "correctiveActions": null
}
```

**Response (201):** `DocumentResult` with generated compliance number.

### `POST /api/compliance/{id}/close`

Close a compliance record.

**Request Body:**

```json
{
  "actorId": "guid",
  "remark": "Review completed"
}
```

---

## 18. Reports (`/api/reports`)

**Default Authorization:** ReportActors (PropertyAdmin, DepartmentManager, ComplianceOfficer, ReportViewer, FinanceOfficer)

### `GET /api/reports/dashboard`

Dashboard KPIs — all authenticated users.

**Response:**

```json
{
  "stockItems": 50,
  "lowStock": 3,
  "pendingStoreRequests": 5,
  "pendingPurchaseRequests": 2,
  "pendingReceiving": 1,
  "pendingReturns": 0,
  "pendingTransfers": 1,
  "pendingHandovers": 0,
  "pendingDisposals": 0,
  "pendingInspections": 1
}
```

---

### `GET /api/reports/stock-summary`

Aggregated stock levels per item.

---

### `GET /api/reports/movements`

Property movement history.

**Query Parameters:** from, to, itemId, transactionType, pageNumber, pageSize

---

### `GET /api/reports/audit`

Audit trail records.

**Query Parameters:** from, to, entityName, userId, pageNumber, pageSize

---

### `GET /api/reports/notifications`

User-filtered notifications.

**Authorization:** Any authenticated user

**Query Parameters:** userId, role, unreadOnly, pageNumber, pageSize

### `POST /api/reports/notifications/{id}/read`

Mark a notification as read.

**Authorization:** Any authenticated user

---

### Document-Specific Reports

All reports support `from`, `to` date filters and `pageNumber`, `pageSize` pagination.

| Endpoint | Report |
|---|---|
| `GET /api/reports/receiving` | Goods Receiving (GRN, consumables only) |
| `GET /api/reports/fixed-assets-receiving` | Fixed Assets Receiving (FARN) |
| `GET /api/reports/issuing` | Goods Issuing (SIV, consumables only) |
| `GET /api/reports/fixed-assets-issuing` | Fixed Assets Issuing (FAIV) |
| `GET /api/reports/returns` | Returns (RMRN) |
| `GET /api/reports/transfers` | Transfers (RMTN) |
| `GET /api/reports/purchase-requests` | Purchase Requisitions |
| `GET /api/reports/inspections` | Inspections |
| `GET /api/reports/custody` | User Custody (filter: `custodianId`) |
| `GET /api/reports/disposals` | Disposals |
| `GET /api/reports/handovers` | Handovers |
| `GET /api/reports/budget-utilization` | Budget Utilization (filter: `fiscalYear`) |
| `GET /api/reports/annual-inventory` | Annual Inventory (filters: `fiscalYear`, `location`) |

---

## Common Models

### ApproveRequest

Used for all approval actions:

```json
{
  "actorId": "guid",
  "remark": "Optional remark"
}
```

### RejectRequest

Used for all rejection actions:

```json
{
  "actorId": "guid",
  "reason": "Mandatory reason"
}
```

### AttachmentRequest

Used within create requests that support file attachments:

```json
{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "storagePath": "/uploads/document.pdf",
  "uploadedById": "guid"
}
```

### StockLineRequest

Used in store request and receiving note details:

```json
{
  "itemId": "guid",
  "shelfId": "guid",
  "quantity": 10,
  "unitCost": 25.50,
  "tagNumber": null,
  "serialNumber": null,
  "remarks": null
}
```

---

## Error Responses

### Validation Error (400)

Returned when FluentValidation catches invalid input:

```json
{
  "errors": {
    "fieldName": ["Validation error message"]
  }
}
```

### Unauthorized (401)

```json
{
  "error": "Invalid or inactive PAS user."
}
```

### Not Found (404)

Returned when a requested resource does not exist.

### Business Rule Error (400/422)

Returned by the workflow service for domain-specific violations:

```json
{
  "error": "BusinessRuleException",
  "message": "Description of the business rule violation"
}
```

### Internal Server Error (500)

Handled by `GlobalExceptionMiddleware`. Returns a generic error message — internal details are logged, not exposed to the client.

---

## Role Authorization Matrix

This matrix shows which roles can access each controller:

| Controller | PropertyAdmin | Storekeeper | DeptManager | ReqStaff | Inspector | ComplianceOfficer | ProcurementOfficer | FinanceOfficer | ReportViewer | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth (login/refresh) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auth (me/roles) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | — | — | — | — | — | — | — | — | — |
| MasterData (read) | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| MasterData (write) | ✅ | ✅ | — | — | — | — | — | — | — | — |
| Safety Boxes (read) | ✅ | ✅ | — | — | — | — | — | — | — | — |
| Safety Boxes (write) | ✅ | ✅ | — | — | — | — | — | — | — | — |
| Stock | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ | ✅ | — |
| Store Requests | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| Purchase Requests | ✅ | — | ✅ | ✅ | — | — | ✅ | — | — | ✅ |
| Receiving | ✅ | ✅ | — | — | — | — | — | — | — | — |
| Inspection | ✅ | ✅ | — | — | ✅ | — | — | — | — | — |
| Issuing | ✅ | ✅ | — | — | — | — | — | — | — | — |
| Custody | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | ✅ |
| Returns | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| Transfers | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ |
| Handovers | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| Disposal | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| Annual Inventory | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ | ✅ | — |
| Compliance | ✅ | — | — | — | — | ✅ | — | — | — | — |
| Reports | ✅ | — | ✅ | — | — | ✅ | — | ✅ | ✅ | — |
| Dashboard KPI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Development Authentication

In development mode, the API supports a secondary **header-based authentication** scheme for rapid testing without JWT tokens:

| Header | Value |
|---|---|
| `X-User-Id` | User's GUID from the database |
| `X-User-Role` | Role name (e.g., `PropertyAdmin`) |

> [!WARNING]
> Header-based authentication is **disabled in production** builds. Always use JWT Bearer tokens for production.
