# Entity Relationship Diagram (ERD)

## AFRICOM Technologies — Property Automation System (PAS)

This document describes the database schema of PAS, organized by functional domain. All entities inherit from `BaseDomainEntity` which provides the common audit fields.

---

## Base Entity

All entities inherit from `BaseDomainEntity`:

```
┌─────────────────────────────┐
│      BaseDomainEntity       │
├─────────────────────────────┤
│ PK  Id           : GUID     │
│     CreatedDate  : DateTime  │
│     UpdatedDate  : DateTime  │
│     CreatedBy    : string?   │
│     UpdatedBy    : string?   │
└─────────────────────────────┘
```

---

## Full ERD Diagram

```mermaid
erDiagram

    %% ── Base Entity (inherited by all) ──
    %% All entities below inherit: Id (PK, GUID), CreatedDate, UpdatedDate, CreatedBy, UpdatedBy

    %% ══════════════════════════════════════════
    %% MASTER DATA DOMAIN
    %% ══════════════════════════════════════════

    Category {
        guid Id PK
        string Name "REQUIRED, max 150, UNIQUE(ParentCategoryId, Name)"
        string Description "NULLABLE"
        guid ParentCategoryId FK "NULLABLE, self-referencing"
    }
    Category ||--o{ Category : "parent → subcategories"

    ItemMaster {
        guid Id PK
        string Sku "REQUIRED, max 80, UNIQUE"
        string ItemName "REQUIRED, max 200"
        string Description "NULLABLE"
        guid CategoryId FK "REQUIRED"
        int PropertyType "FixedAsset=1, Consumable=2"
        string UnitOfMeasure "REQUIRED, max 50"
        bool RequiresInspection
        int MinStockLevel
        decimal UnitCost "precision 18,2"
        bool IsActive "default true"
    }
    Category ||--o{ ItemMaster : "has items"

    Warehouse {
        guid Id PK
        string WarehouseName "REQUIRED, max 200"
        string LocationCode "REQUIRED, max 80, UNIQUE"
        string LocationType "NULLABLE (HO, Branch, ReTC)"
        string Address "NULLABLE"
        guid ParentWarehouseId FK "NULLABLE, self-referencing"
    }
    Warehouse ||--o{ Warehouse : "parent → children"

    ShelfLocation {
        guid Id PK
        guid WarehouseId FK "REQUIRED"
        string Aisle "NULLABLE"
        string Rack "NULLABLE"
        string ShelfNumber "REQUIRED, max 80"
        string Bin "NULLABLE"
        string QrCodeValue "REQUIRED, max 200, UNIQUE"
        decimal Capacity "NULLABLE, precision 18,2"
    }
    Warehouse ||--o{ ShelfLocation : "has shelves"

    Supplier {
        guid Id PK
        string SupplierName "REQUIRED, max 200"
        string ContactPerson "NULLABLE"
        string TinNumber "NULLABLE, FILTERED UNIQUE"
        string PhoneNumber "NULLABLE"
        string Email "NULLABLE"
    }

    PropertyField {
        guid Id PK
        string FieldName "REQUIRED, max 150, UNIQUE"
        int FieldType "Text=1, Number=2, Date=3, Boolean=4, Selection=5"
        bool IsRequired
        int ApplicablePropertyType "NULLABLE"
        int DisplayOrder
        string Options "NULLABLE, JSON array"
        bool IsActive "default true"
    }

    PropertyFieldValue {
        guid Id PK
        guid PropertyFieldId FK "REQUIRED, UNIQUE(PropertyFieldId, ItemId)"
        guid ItemId FK "REQUIRED"
        string Value "REQUIRED"
    }
    PropertyField ||--o{ PropertyFieldValue : "has values"
    ItemMaster ||--o{ PropertyFieldValue : "has field values"

    BudgetAllocation {
        guid Id PK
        int FiscalYear "UNIQUE(FiscalYear, Department, Division)"
        string Department "NULLABLE"
        string Division "NULLABLE"
        decimal AllocatedAmount "precision 18,2"
        decimal UtilizedAmount "precision 18,2"
    }

    %% ══════════════════════════════════════════
    %% USERS & AUTH DOMAIN
    %% ══════════════════════════════════════════

    AppUser {
        guid Id PK
        string EmployeeId "REQUIRED, max 80, UNIQUE"
        string UserName "REQUIRED, max 100, UNIQUE"
        string FullName "REQUIRED, max 200"
        string PasswordHash "REQUIRED, max 200"
        int Role "UserRole enum"
        string Department "NULLABLE"
        string Division "NULLABLE"
        string Location "NULLABLE"
        string Title "NULLABLE"
        guid RefreshToken "NULLABLE, FILTERED UNIQUE"
        datetime RefreshTokenExpiresAt "NULLABLE"
        bool IsActive "default true"
        int FailedLoginAttempts "default 0"
        datetime LockedUntil "NULLABLE"
    }

    %% ══════════════════════════════════════════
    %% SAFETY BOX DOMAIN
    %% ══════════════════════════════════════════

    SafetyBox {
        guid Id PK
        string BoxNumber "REQUIRED, max 80, UNIQUE"
        guid WarehouseId FK "REQUIRED"
        string Description "NULLABLE"
        string Category "NULLABLE"
        int TotalShelves
        bool IsActive "default true"
    }
    Warehouse ||--o{ SafetyBox : "has safety boxes"

    SafetyBoxShelf {
        guid Id PK
        guid SafetyBoxId FK "REQUIRED"
        string ShelfLabel "REQUIRED, max 80"
        decimal WeightCapacity "NULLABLE, precision 18,2"
        decimal VolumeCapacity "NULLABLE, precision 18,2"
        guid ShelfLocationId FK "NULLABLE"
    }
    SafetyBox ||--o{ SafetyBoxShelf : "has shelves"
    ShelfLocation ||--o| SafetyBoxShelf : "linked shelf"

    %% ══════════════════════════════════════════
    %% STOCK CONTROL DOMAIN
    %% ══════════════════════════════════════════

    InventoryStock {
        guid Id PK
        guid ItemId FK "REQUIRED, UNIQUE(ItemId, ShelfId)"
        guid ShelfId FK "REQUIRED"
        int CurrentQuantity "CHECK >= 0"
        int ReservedQuantity "CHECK >= 0"
        int BookBalance
        int PhysicalBalance
        int Discrepancy
        datetime LastCountedAt "NULLABLE"
    }
    ItemMaster ||--o{ InventoryStock : "stock per shelf"
    ShelfLocation ||--o{ InventoryStock : "stock on shelf"

    StockLedger {
        guid Id PK
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "REQUIRED"
        int QuantityChange
        int BalanceAfter
        int TransactionType "StockTransactionType enum"
        int DocumentType "NULLABLE, DocumentType enum"
        guid ReferenceId "NULLABLE"
        string ReferenceNumber "NULLABLE, INDEXED"
        decimal UnitCost "NULLABLE, precision 18,2"
        string Reason "NULLABLE"
        datetime TransactionDate "INDEX(ItemId, ShelfId, TransactionDate)"
    }
    ItemMaster ||--o{ StockLedger : "ledger entries"
    ShelfLocation ||--o{ StockLedger : "ledger location"

    %% ══════════════════════════════════════════
    %% STORE REQUISITION DOMAIN
    %% ══════════════════════════════════════════

    ServiceRequest {
        guid Id PK
        string SrNumber "REQUIRED, max 80, UNIQUE"
        guid RequesterId FK "REQUIRED"
        guid ApprovedById FK "NULLABLE"
        guid AuthorizedById FK "NULLABLE"
        datetime RequestDate
        int RequestType "RequestType enum"
        int Status "WorkflowStatus enum"
        string Reason "NULLABLE"
        string SupervisorRemark "NULLABLE"
    }
    AppUser ||--o{ ServiceRequest : "requester"
    AppUser ||--o{ ServiceRequest : "approver"

    ServiceRequestDetail {
        guid Id PK
        guid ServiceRequestId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "NULLABLE"
        int RequestedQty
        int ApprovedQty
        int IssuedQty
        decimal UnitCost "NULLABLE, precision 18,2"
        string Remarks "NULLABLE"
    }
    ServiceRequest ||--o{ ServiceRequestDetail : "line items"
    ItemMaster ||--o{ ServiceRequestDetail : "requested item"

    %% ══════════════════════════════════════════
    %% PURCHASE REQUISITION DOMAIN
    %% ══════════════════════════════════════════

    PurchaseRequest {
        guid Id PK
        string PrNumber "REQUIRED, max 80, UNIQUE"
        guid RequesterId FK "REQUIRED"
        guid ApprovedById FK "NULLABLE"
        datetime RequestDate
        int Status "WorkflowStatus enum"
        int RequestType "RequestType enum"
        string Justification "NULLABLE"
        decimal EstimatedBudget "NULLABLE, precision 18,2"
        string RejectionReason "NULLABLE"
    }
    AppUser ||--o{ PurchaseRequest : "requester"

    PurchaseRequestDetail {
        guid Id PK
        guid PurchaseRequestId FK "REQUIRED"
        guid ItemId FK "NULLABLE"
        string ItemDescription "REQUIRED"
        string UnitOfMeasure "REQUIRED"
        int Quantity
        decimal UnitCost "NULLABLE, precision 18,2"
    }
    PurchaseRequest ||--o{ PurchaseRequestDetail : "line items"
    ItemMaster ||--o{ PurchaseRequestDetail : "requested item"

    %% ══════════════════════════════════════════
    %% RECEIVING DOMAIN
    %% ══════════════════════════════════════════

    ReceivingNote {
        guid Id PK
        string GrnNumber "REQUIRED, max 80, UNIQUE"
        string FarnNumber "NULLABLE, max 80, FILTERED UNIQUE"
        guid SupplierId FK "REQUIRED"
        guid WarehouseId FK "REQUIRED"
        guid ReceivedById FK "REQUIRED"
        guid ApprovedById FK "NULLABLE"
        guid PurchaseRequestId FK "NULLABLE"
        datetime ReceivedDate
        int Status "WorkflowStatus enum"
        string InvoiceNumber "NULLABLE"
        string PurchaseOrderNumber "NULLABLE"
        string StoreRequestNumber "NULLABLE"
        string TenderReferenceNumber "NULLABLE"
        string Notes "NULLABLE"
    }
    Supplier ||--o{ ReceivingNote : "supplies goods"
    Warehouse ||--o{ ReceivingNote : "receiving location"
    AppUser ||--o{ ReceivingNote : "received by"
    PurchaseRequest ||--o{ ReceivingNote : "linked PR"

    ReceivingNoteDetail {
        guid Id PK
        guid ReceivingNoteId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "NULLABLE"
        int QuantityReceived
        decimal UnitCost "precision 18,2"
        string TagNumber "NULLABLE, FILTERED UNIQUE"
        string SerialNumber "NULLABLE, FILTERED INDEX"
    }
    ReceivingNote ||--o{ ReceivingNoteDetail : "line items"
    ItemMaster ||--o{ ReceivingNoteDetail : "received item"

    InspectionLog {
        guid Id PK
        guid ReceivingNoteId FK "REQUIRED, 1:1"
        guid InspectorId FK "REQUIRED"
        bool IsPassed
        string DeviationNotes "NULLABLE"
        datetime InspectionDate
    }
    ReceivingNote ||--o| InspectionLog : "inspection result"
    AppUser ||--o{ InspectionLog : "inspector"

    %% ══════════════════════════════════════════
    %% ISSUING DOMAIN
    %% ══════════════════════════════════════════

    StoreIssueVoucher {
        guid Id PK
        guid ServiceRequestId FK "REQUIRED, 1:1"
        string SivNumber "REQUIRED, max 80, UNIQUE"
        string FaivNumber "NULLABLE, max 80, FILTERED UNIQUE"
        int VoucherType "DocumentType enum"
        datetime IssueDate
        guid IssuedById FK "REQUIRED"
        string RecipientSignature "NULLABLE"
        int Status "WorkflowStatus enum"
    }
    ServiceRequest ||--o| StoreIssueVoucher : "issue voucher"
    AppUser ||--o{ StoreIssueVoucher : "issued by"

    StoreIssueVoucherDetail {
        guid Id PK
        guid StoreIssueVoucherId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "REQUIRED"
        int QuantityIssued
        decimal UnitCost "NULLABLE, precision 18,2"
    }
    StoreIssueVoucher ||--o{ StoreIssueVoucherDetail : "line items"
    ItemMaster ||--o{ StoreIssueVoucherDetail : "issued item"

    %% ══════════════════════════════════════════
    %% RETURNS DOMAIN
    %% ══════════════════════════════════════════

    PropertyReturn {
        guid Id PK
        string RmrnNumber "REQUIRED, max 80, UNIQUE"
        guid ReturnedById FK "REQUIRED"
        guid ReceivedById FK "NULLABLE"
        guid AuthorizedById FK "NULLABLE"
        datetime ReturnDate
        int Status "WorkflowStatus enum"
        string Reason "NULLABLE"
    }
    AppUser ||--o{ PropertyReturn : "returned by"

    PropertyReturnDetail {
        guid Id PK
        guid PropertyReturnId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "REQUIRED"
        int Quantity
        decimal UnitCost "NULLABLE, precision 18,2"
        string TagNumber "NULLABLE"
        string SerialNumber "NULLABLE"
        int Condition "PropertyCondition enum"
    }
    PropertyReturn ||--o{ PropertyReturnDetail : "line items"
    ItemMaster ||--o{ PropertyReturnDetail : "returned item"

    %% ══════════════════════════════════════════
    %% TRANSFER DOMAIN
    %% ══════════════════════════════════════════

    PropertyTransfer {
        guid Id PK
        string RmtnNumber "REQUIRED, max 80, UNIQUE"
        guid FromCustodianId FK "REQUIRED"
        guid ToCustodianId FK "REQUIRED"
        guid AuthorizedById FK "NULLABLE"
        datetime TransferDate
        int Status "WorkflowStatus enum"
        string Reason "NULLABLE"
    }
    AppUser ||--o{ PropertyTransfer : "from custodian"
    AppUser ||--o{ PropertyTransfer : "to custodian"

    PropertyTransferDetail {
        guid Id PK
        guid PropertyTransferId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        int Quantity
        string TagNumber "NULLABLE"
        string SerialNumber "NULLABLE"
    }
    PropertyTransfer ||--o{ PropertyTransferDetail : "line items"
    ItemMaster ||--o{ PropertyTransferDetail : "transferred item"

    %% ══════════════════════════════════════════
    %% HANDOVER DOMAIN
    %% ══════════════════════════════════════════

    PropertyHandover {
        guid Id PK
        string HandoverNumber "REQUIRED, max 80, UNIQUE"
        guid HandoverFromId FK "REQUIRED"
        guid HandoverToId FK "REQUIRED"
        guid AuthorizedById FK "NULLABLE"
        datetime HandoverDate
        int Status "WorkflowStatus enum"
        string Purpose "NULLABLE"
        string FromLocation "NULLABLE"
        string ToLocation "NULLABLE"
        string Remarks "NULLABLE"
    }
    AppUser ||--o{ PropertyHandover : "handover from"
    AppUser ||--o{ PropertyHandover : "handover to"

    PropertyHandoverDetail {
        guid Id PK
        guid PropertyHandoverId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        int Quantity
        string TagNumber "NULLABLE"
        string SerialNumber "NULLABLE"
        string FarnNumber "NULLABLE"
        string RmrnNumber "NULLABLE"
        string FaivNumber "NULLABLE"
    }
    PropertyHandover ||--o{ PropertyHandoverDetail : "line items"
    ItemMaster ||--o{ PropertyHandoverDetail : "handed-over item"

    %% ══════════════════════════════════════════
    %% CUSTODY DOMAIN
    %% ══════════════════════════════════════════

    UserCustody {
        guid Id PK
        guid CustodianId FK "REQUIRED, INDEX(CustodianId, ItemId, TagNumber, SerialNumber)"
        guid ItemId FK "REQUIRED"
        int Quantity
        string TagNumber "NULLABLE"
        string SerialNumber "NULLABLE"
        string SourceDocumentNumber "REQUIRED"
    }
    AppUser ||--o{ UserCustody : "custodian"
    ItemMaster ||--o{ UserCustody : "custody item"

    %% ══════════════════════════════════════════
    %% DISPOSAL DOMAIN
    %% ══════════════════════════════════════════

    DisposalRecord {
        guid Id PK
        string DisposalNumber "REQUIRED, max 80, UNIQUE"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "NULLABLE"
        guid CustodianId FK "NULLABLE"
        int Quantity
        int Condition "PropertyCondition enum"
        int DisposalMethod "DisposalMethod enum"
        int Status "WorkflowStatus enum"
        guid ApprovedById FK "NULLABLE"
        string Notes "NULLABLE"
    }
    ItemMaster ||--o{ DisposalRecord : "disposed item"
    AppUser ||--o{ DisposalRecord : "custodian"

    %% ══════════════════════════════════════════
    %% ANNUAL INVENTORY DOMAIN
    %% ══════════════════════════════════════════

    AnnualInventory {
        guid Id PK
        string InventoryNumber "REQUIRED, max 80, UNIQUE"
        int FiscalYear "INDEX(FiscalYear, Location)"
        string Location "REQUIRED"
        guid CountedById FK "REQUIRED"
        int Status "WorkflowStatus enum"
        datetime CountDate
    }
    AppUser ||--o{ AnnualInventory : "counted by"

    AnnualInventoryLine {
        guid Id PK
        guid AnnualInventoryId FK "REQUIRED"
        guid ItemId FK "REQUIRED"
        guid ShelfId FK "NULLABLE"
        int ExpectedQuantity
        int CountedQuantity
        int Discrepancy
        string Notes "NULLABLE"
    }
    AnnualInventory ||--o{ AnnualInventoryLine : "count lines"
    ItemMaster ||--o{ AnnualInventoryLine : "counted item"

    %% ══════════════════════════════════════════
    %% COMPLIANCE DOMAIN
    %% ══════════════════════════════════════════

    ComplianceRecord {
        guid Id PK
        string ComplianceNumber "REQUIRED, max 80, UNIQUE"
        guid InventoryId FK "NULLABLE"
        guid ReviewedById FK "REQUIRED"
        int Status "WorkflowStatus enum"
        string Findings "NULLABLE"
        string Recommendations "NULLABLE"
        string CorrectiveActions "NULLABLE"
        datetime ReviewDate
    }
    AnnualInventory ||--o{ ComplianceRecord : "reviewed inventory"
    AppUser ||--o{ ComplianceRecord : "reviewed by"

    %% ══════════════════════════════════════════
    %% SYSTEM DOMAIN
    %% ══════════════════════════════════════════

    DocumentSequence {
        guid Id PK
        int DocumentType "DocumentType enum, UNIQUE(DocumentType, Year)"
        int Year
        int NextNumber "default 1"
    }

    DocumentAttachment {
        guid Id PK
        int DocumentType "DocumentType enum, INDEX(DocumentType, ReferenceId)"
        guid ReferenceId
        string FileName "REQUIRED, max 260"
        string ContentType "NULLABLE"
        string StoragePath "REQUIRED, max 500"
        guid UploadedById FK "NULLABLE"
    }
    AppUser ||--o{ DocumentAttachment : "uploaded by"

    NotificationEvent {
        guid Id PK
        guid RecipientId FK "NULLABLE"
        int RecipientRole "NULLABLE, UserRole enum"
        string Title "REQUIRED"
        string Message "REQUIRED"
        guid ReferenceId "NULLABLE"
        string ReferenceNumber "NULLABLE"
        bool IsRead "default false"
        datetime ReadAt "NULLABLE"
    }
    AppUser ||--o{ NotificationEvent : "recipient"

    AuditTrail {
        guid Id PK
        guid UserId FK "NULLABLE"
        string Action "REQUIRED"
        string EntityName "REQUIRED"
        guid EntityId "NULLABLE"
        string Details "NULLABLE"
        datetime ActionDate
    }
    AppUser ||--o{ AuditTrail : "actor"
```

---

## Database Views

| View | Purpose | Source |
|---|---|---|
| `vw_StockSummary` | Aggregated stock levels per item across all shelf locations | `InventoryStock` + `ItemMaster` |
| `vw_PropertyMovement` | Chronological property movement ledger | `StockLedger` + `ItemMaster` |

---

## Entity Summary Table

| # | Entity | Table Name | Domain | Key Constraints |
|---|---|---|---|---|
| 1 | `Category` | Categories | Master Data | UNIQUE(ParentCategoryId, Name) |
| 2 | `ItemMaster` | ItemMasters | Master Data | UNIQUE(Sku) |
| 3 | `AppUser` | Users | Auth | UNIQUE(EmployeeId), UNIQUE(UserName), FILTERED UNIQUE(RefreshToken) |
| 4 | `Warehouse` | Warehouses | Master Data | UNIQUE(LocationCode) |
| 5 | `ShelfLocation` | ShelfLocations | Master Data | UNIQUE(QrCodeValue), UNIQUE(WarehouseId, Aisle, Rack, ShelfNumber, Bin) |
| 6 | `SafetyBox` | SafetyBoxes | Safety Box | UNIQUE(BoxNumber) |
| 7 | `SafetyBoxShelf` | SafetyBoxShelves | Safety Box | — |
| 8 | `PropertyField` | PropertyFields | Master Data | UNIQUE(FieldName) |
| 9 | `PropertyFieldValue` | PropertyFieldValues | Master Data | UNIQUE(PropertyFieldId, ItemId) |
| 10 | `InventoryStock` | InventoryStocks | Stock | UNIQUE(ItemId, ShelfId), CHECK(CurrentQuantity ≥ 0), CHECK(ReservedQuantity ≥ 0) |
| 11 | `StockLedger` | StockLedgers | Stock | INDEX(ItemId, ShelfId, TransactionDate), INDEX(ReferenceNumber) |
| 12 | `Supplier` | Suppliers | Master Data | FILTERED UNIQUE(TinNumber) |
| 13 | `DocumentAttachment` | DocumentAttachments | System | INDEX(DocumentType, ReferenceId) |
| 14 | `NotificationEvent` | NotificationEvents | System | — |
| 15 | `AuditTrail` | AuditTrails | System | — |
| 16 | `DocumentSequence` | DocumentSequences | System | UNIQUE(DocumentType, Year) |
| 17 | `ServiceRequest` | ServiceRequests | Requisition | UNIQUE(SrNumber) |
| 18 | `ServiceRequestDetail` | ServiceRequestDetails | Requisition | — |
| 19 | `PurchaseRequest` | PurchaseRequests | Requisition | UNIQUE(PrNumber) |
| 20 | `PurchaseRequestDetail` | PurchaseRequestDetails | Requisition | — |
| 21 | `ReceivingNote` | ReceivingNotes | Receiving | UNIQUE(GrnNumber), FILTERED UNIQUE(FarnNumber) |
| 22 | `ReceivingNoteDetail` | ReceivingNoteDetails | Receiving | FILTERED UNIQUE(TagNumber) |
| 23 | `InspectionLog` | InspectionLogs | Receiving | 1:1 with ReceivingNote |
| 24 | `StoreIssueVoucher` | StoreIssueVouchers | Issuing | UNIQUE(SivNumber), FILTERED UNIQUE(FaivNumber), 1:1 with ServiceRequest |
| 25 | `StoreIssueVoucherDetail` | StoreIssueVoucherDetails | Issuing | — |
| 26 | `PropertyReturn` | PropertyReturns | Returns | UNIQUE(RmrnNumber) |
| 27 | `PropertyReturnDetail` | PropertyReturnDetails | Returns | — |
| 28 | `PropertyTransfer` | PropertyTransfers | Transfer | UNIQUE(RmtnNumber) |
| 29 | `PropertyTransferDetail` | PropertyTransferDetails | Transfer | — |
| 30 | `UserCustody` | UserCustodies | Custody | INDEX(CustodianId, ItemId, TagNumber, SerialNumber) |
| 31 | `DisposalRecord` | DisposalRecords | Disposal | UNIQUE(DisposalNumber) |
| 32 | `AnnualInventory` | AnnualInventories | Inventory | UNIQUE(InventoryNumber), INDEX(FiscalYear, Location) |
| 33 | `AnnualInventoryLine` | AnnualInventoryLines | Inventory | — |
| 34 | `PropertyHandover` | PropertyHandovers | Handover | UNIQUE(HandoverNumber) |
| 35 | `PropertyHandoverDetail` | PropertyHandoverDetails | Handover | — |
| 36 | `ComplianceRecord` | ComplianceRecords | Compliance | UNIQUE(ComplianceNumber) |
| 37 | `BudgetAllocation` | BudgetAllocations | Budget | UNIQUE(FiscalYear, Department, Division) |

---

## Key Relationship Patterns

### Header–Detail (1:N)

Most workflow documents follow a header-detail pattern:

| Header Entity | Detail Entity | Relationship |
|---|---|---|
| ServiceRequest | ServiceRequestDetail | 1:N |
| PurchaseRequest | PurchaseRequestDetail | 1:N |
| ReceivingNote | ReceivingNoteDetail | 1:N |
| StoreIssueVoucher | StoreIssueVoucherDetail | 1:N |
| PropertyReturn | PropertyReturnDetail | 1:N |
| PropertyTransfer | PropertyTransferDetail | 1:N |
| PropertyHandover | PropertyHandoverDetail | 1:N |
| AnnualInventory | AnnualInventoryLine | 1:N |
| SafetyBox | SafetyBoxShelf | 1:N |

### One-to-One Relationships

| Entity A | Entity B | Constraint |
|---|---|---|
| ReceivingNote | InspectionLog | FK on InspectionLog.ReceivingNoteId |
| ServiceRequest | StoreIssueVoucher | FK on StoreIssueVoucher.ServiceRequestId |

### Self-Referencing Hierarchies

| Entity | Parent FK | Children Collection |
|---|---|---|
| Category | ParentCategoryId | SubCategories |
| Warehouse | ParentWarehouseId | ChildLocations |

### Global Delete Behavior

All foreign keys use **`DeleteBehavior.Restrict`** — no cascade deletes are permitted in the schema.
