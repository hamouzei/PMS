# Software Requirements Specification (SRS)

## AFRICOM Technologies — Property Automation System (PAS)

| Field | Value |
|---|---|
| **Project** | Property Automation System (PAS) |
| **Organization** | AFRICOM Technologies — Ethiopia Commodity Exchange (ECX) |
| **Version** | 1.0 |
| **Date** | August 2026 |
| **Architecture** | Clean Architecture (.NET 10 + Angular 19 + SQL Server 2022) |

---

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
  - [1.3 Definitions & Acronyms](#13-definitions--acronyms)
  - [1.4 References](#14-references)
- [2. Overall Description](#2-overall-description)
  - [2.1 Product Perspective](#21-product-perspective)
  - [2.2 User Classes & Roles](#22-user-classes--roles)
  - [2.3 Operating Environment](#23-operating-environment)
  - [2.4 Design & Implementation Constraints](#24-design--implementation-constraints)
  - [2.5 Assumptions & Dependencies](#25-assumptions--dependencies)
- [3. Functional Requirements](#3-functional-requirements)
  - [SR001 — Dashboard & Notifications](#sr001--dashboard--notifications)
  - [SR002 — User & Admin Management](#sr002--user--admin-management)
  - [SR003 — Master Data Management](#sr003--master-data-management)
  - [SR004 — Safety Box Management](#sr004--safety-box-management)
  - [SR005 — Store Requisition](#sr005--store-requisition)
  - [SR006 — Purchase Requisition & Budget](#sr006--purchase-requisition--budget)
  - [SR007 — Stock Control](#sr007--stock-control)
  - [SR009 — Property Receiving (GRN / FARN)](#sr009--property-receiving-grn--farn)
  - [SR0010 — Property Issuing (SIV / FAIV)](#sr0010--property-issuing-siv--faiv)
  - [SR0011 — Inspection Management](#sr0011--inspection-management)
  - [SR0012 — Property Return (RMRN)](#sr0012--property-return-rmrn)
  - [FR0013 — User Custody Tracking](#fr0013--user-custody-tracking)
  - [FR0014 — Property Transfer (RMTN)](#fr0014--property-transfer-rmtn)
  - [FR0015 — Property Handover](#fr0015--property-handover)
  - [FR0016 — Compliance Management](#fr0016--compliance-management)
  - [FR0017 — Stock Disposal](#fr0017--stock-disposal)
  - [FR0018 — Safety Box Dashboard](#fr0018--safety-box-dashboard)
  - [FR0019 — Reporting & Analytics](#fr0019--reporting--analytics)
  - [FR0020 — Annual Physical Inventory](#fr0020--annual-physical-inventory)
- [4. Authentication & Security Requirements](#4-authentication--security-requirements)
  - [4.1 Login & Account Lockout](#41-login--account-lockout)
  - [4.2 JWT Token Lifecycle](#42-jwt-token-lifecycle)
  - [4.3 Role-Based Access Control (RBAC)](#43-role-based-access-control-rbac)
- [5. Non-Functional Requirements](#5-non-functional-requirements)
  - [5.1 Performance](#51-performance)
  - [5.2 Data Integrity](#52-data-integrity)
  - [5.3 Audit & Traceability](#53-audit--traceability)
  - [5.4 Scalability](#54-scalability)
  - [5.5 Usability](#55-usability)
- [6. Data Requirements](#6-data-requirements)
  - [6.1 Document Numbering](#61-document-numbering)
  - [6.2 Tag Number Convention](#62-tag-number-convention)
  - [6.3 Enumerations](#63-enumerations)
- [7. External Interface Requirements](#7-external-interface-requirements)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for the **AFRICOM Technologies Property Automation System (PAS)**. PAS digitizes the complete lifecycle of organizational property — from procurement and receiving through custody tracking, inter-departmental transfers, returns, disposal, and regulatory compliance — replacing manual paper-based workflows with automated, auditable digital processes.

### 1.2 Scope

PAS covers:

- **Master Data Management** — Categories, items (SKU registry), warehouses, shelf locations, suppliers, custom property fields, and budget allocations.
- **Workflow Modules** — Store requisitions, purchase requisitions, property receiving, inspection, property issuing, returns, transfers, handovers, disposal, annual inventory, and compliance reviews.
- **Stock Control** — Real-time inventory management with ledger-based double-entry tracking, reservation system, bin-card management, and safety box monitoring.
- **Reporting & Analytics** — Dashboard KPIs, document-specific reports, stock summaries, movement history, audit trails, and notification center.
- **User Management** — Role-based access, account lockout, JWT authentication, and development-mode header authentication.

### 1.3 Definitions & Acronyms

| Acronym | Definition |
|---|---|
| **PAS** | Property Automation System |
| **SR** | Store Request |
| **PR** | Purchase Requisition |
| **GRN** | Goods Receipt Note (consumables) |
| **FARN** | Fixed Asset Receiving Note |
| **SIV** | Store Issue Voucher (consumables) |
| **FAIV** | Fixed Asset Issue Voucher |
| **RMRN** | Return Material Return Note |
| **RMTN** | Return Material Transfer Note |
| **ECX** | Ethiopia Commodity Exchange |
| **CQRS** | Command Query Responsibility Segregation |
| **JWT** | JSON Web Token |
| **RBAC** | Role-Based Access Control |
| **KPI** | Key Performance Indicator |
| **SKU** | Stock Keeping Unit |
| **OCC** | Optimistic Concurrency Control |

### 1.4 References

- AFRICOM Technologies Property Administration Procedure Manual
- Software Requirements Specification (internal document)
- .NET 10 & ASP.NET Core documentation
- Angular 19 documentation

---

## 2. Overall Description

### 2.1 Product Perspective

PAS is a full-stack enterprise web application built on **Clean Architecture** (Onion Architecture) with strict dependency inversion:

```
┌───────────────────────────────────────────────────────┐
│  PMS.Web (Angular 19 SPA)                             │
│  Standalone components · Lazy-loaded routes · Lucide  │
└──────────────────┬────────────────────────────────────┘
                   │ HTTP (JSON over REST)
┌──────────────────▼────────────────────────────────────┐
│  PMS.API (.NET 10 Web API)                            │
│  Controllers · JWT Auth · RBAC · Exception Middleware │
└──────────────────┬────────────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────────────┐
│  PMS.Application (Use Cases)                          │
│  CQRS (MediatR) · DTOs · FluentValidation            │
└──────────────────┬────────────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────────────┐
│  PMS.Domain (Core Entities & Enums)                   │
│  Zero external dependencies                           │
└──────────────────┬────────────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────────────┐
│  PMS.Persistence (Infrastructure)                     │
│  EF Core 10 · SQL Server · Repository · Migrations    │
└───────────────────────────────────────────────────────┘
```

### 2.2 User Classes & Roles

| Role | Scope & Permissions |
|---|---|
| **PropertyAdmin** | Full system access — master data, all workflows, user management, reports |
| **Storekeeper** | Receiving, stock control, issuing, returns, transfers, safety boxes |
| **DepartmentManager** | Approve/reject requisitions, handovers; view custody and reports |
| **RequisitioningStaff** | Submit store and purchase requests |
| **Inspector** | Record inspection results on received goods |
| **ComplianceOfficer** | Compliance reviews, audit trail reports, disposal oversight |
| **ProcurementOfficer** | Purchase requisition workflows, supplier management |
| **FinanceOfficer** | Financial reports, budget utilization views |
| **ReportViewer** | Read-only access to reports and dashboards |
| **Employee** | Submit requests and view own custody |

**Composite Role Groups (used in authorization):**

| Group | Composed Of |
|---|---|
| `AdminOrStorekeeper` | PropertyAdmin, Storekeeper |
| `RequestActors` | Employee, RequisitioningStaff, DepartmentManager, PropertyAdmin |
| `Approvers` | DepartmentManager, PropertyAdmin |
| `StockActors` | PropertyAdmin, Storekeeper |
| `ReportActors` | PropertyAdmin, DepartmentManager, ComplianceOfficer, ReportViewer, FinanceOfficer |
| `HandoverActors` | PropertyAdmin, DepartmentManager, Storekeeper |
| `ComplianceActors` | ComplianceOfficer, PropertyAdmin |

### 2.3 Operating Environment

| Component | Technology | Version |
|---|---|---|
| Runtime | .NET SDK | 10.0 |
| Web Framework | ASP.NET Core | 10.0 |
| ORM | Entity Framework Core | 10.0.7 |
| Database | SQL Server | 2022+ |
| CQRS | MediatR | Latest |
| Validation | FluentValidation | Latest |
| Mapping | AutoMapper | Latest |
| Password Hashing | BCrypt.Net | Latest |
| Auth Tokens | JWT Bearer | 10.0.7 |
| API Docs | Swashbuckle | 10.1.7 |
| Frontend | Angular | 19.x |
| Language | TypeScript | 5.6 |

### 2.4 Design & Implementation Constraints

- **Clean Architecture**: All domain logic resides in `PMS.Domain` with zero external dependencies. Infrastructure depends inward toward the domain.
- **CQRS Pattern**: Commands and queries are dispatched through MediatR with a validation pipeline behavior.
- **Code-First Migrations**: Database schema is managed entirely through EF Core code-first migrations.
- **Restrict Delete Behavior**: All foreign keys use `DeleteBehavior.Restrict` — no cascade deletes.
- **Audit Fields**: Every entity inherits `BaseDomainEntity` with automatic `CreatedDate`, `UpdatedDate`, `CreatedBy`, and `UpdatedBy` population via `SaveChangesAsync` interceptor.
- **Ethiopian Calendar**: The frontend supports dual Gregorian/Ethiopian date display.

### 2.5 Assumptions & Dependencies

- SQL Server 2019+ (LocalDB, Express, or full edition) is available.
- Node.js 20.x LTS is available for the Angular frontend.
- Secrets (JWT key, connection string) are stored via .NET User Secrets or a secrets manager.
- CORS is configured for the Angular development server at `http://localhost:4200`.

---

## 3. Functional Requirements

### SR001 — Dashboard & Notifications

**Description:** Provide a centralized landing-page dashboard with KPI tiles showing pending workflow counts and system alerts. An in-app notification center tracks workflow transitions for affected parties.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR001-01 | Display KPI counts: stock items, low-stock alerts, pending SRs, pending PRs, pending receiving, pending returns, pending transfers, pending handovers, pending disposals, pending inspections. |
| SR001-02 | All authenticated users may view the dashboard. |
| SR001-03 | Notifications are created automatically on workflow state transitions. |
| SR001-04 | Notifications target either a specific user (`RecipientId`) or a role (`RecipientRole`). |
| SR001-05 | Users can filter notifications by user, role, and unread status with pagination. |
| SR001-06 | Users can mark individual notifications as read (sets `IsRead = true`, records `ReadAt` timestamp). |

---

### SR002 — User & Admin Management

**Description:** System administrators manage user accounts, roles, departments, activation status, password resets, and budget allocations.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR002-01 | PropertyAdmin can create new user accounts with: EmployeeId, UserName, FullName, Password, Role, Department, Division, Location, Title. |
| SR002-02 | PropertyAdmin can update user details: FullName, Role, Department, Division, Location, Title, IsActive. |
| SR002-03 | PropertyAdmin can deactivate/activate user accounts. |
| SR002-04 | PropertyAdmin can reset user passwords and unlock locked accounts. |
| SR002-05 | Passwords are stored as BCrypt hashes; raw passwords are never persisted. |
| SR002-06 | PropertyAdmin can seed demo data via `POST /api/admin/seed`. |
| SR002-07 | PropertyAdmin can view all users list. |

---

### SR003 — Master Data Management

**Description:** Manage the foundational reference data used across all workflows.

**Functional Requirements:**

| ID | Requirement | Data Fields |
|---|---|---|
| SR003-01 | **Categories** — Create/update hierarchical categories with optional parent. | Name, Description, ParentCategoryId |
| SR003-02 | **Item Master** — Create/update SKU-based items. | Sku (unique), ItemName, Description, CategoryId, PropertyType (FixedAsset/Consumable), UnitOfMeasure, RequiresInspection, MinStockLevel, UnitCost |
| SR003-03 | **Warehouses** — Create warehouses with hierarchical location structure. | WarehouseName, LocationCode (unique), LocationType (HO/Branch/ReTC), Address, ParentWarehouseId |
| SR003-04 | **Shelf Locations** — Create shelves within warehouses. | WarehouseId, Aisle, Rack, ShelfNumber, Bin, QrCodeValue (unique), Capacity |
| SR003-05 | **Suppliers** — Create supplier records indexed by TIN. | SupplierName, ContactPerson, TinNumber (unique filtered), PhoneNumber, Email |
| SR003-06 | **Custom Property Fields** — Define custom metadata fields for items. | FieldName (unique), FieldType (Text/Number/Date/Boolean/Selection), IsRequired, ApplicablePropertyType, DisplayOrder, Options (JSON array for Selection type) |
| SR003-07 | **Property Field Values** — Set values for custom fields per item. | PropertyFieldId, ItemId, Value |
| SR003-08 | Search/autocomplete endpoints for items, categories, users, and warehouses with query and max results filtering. | |

---

### SR004 — Safety Box Management

**Description:** Manage configurable safety boxes within warehouses with shelf capacity tracking.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR004-01 | Create safety boxes assigned to a warehouse with: BoxNumber (unique), Description, Category, TotalShelves. |
| SR004-02 | Create shelves within safety boxes with: ShelfLabel, WeightCapacity, VolumeCapacity, optional ShelfLocationId link. |
| SR004-03 | View all safety boxes with active shelf count. |
| SR004-04 | View safety box detail with all shelves and linked shelf locations. |

---

### SR005 — Store Requisition

**Description:** Staff submit store requests (SRs) for items from the warehouse. SRs follow an approval workflow with stock reservation.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR005-01 | Create a store request with: RequesterId, RequestType (Budgeted/Replacement/Emergency/Other), Reason, and line items (ItemId, ShelfId, Quantity, UnitCost, Remarks). |
| SR005-02 | System auto-generates a unique SR number in format `SR-{YYYY}-{NNNNN}`. |
| SR005-03 | Initial status is `Submitted`. |
| SR005-04 | Approvers (DepartmentManager, PropertyAdmin) can approve with remark — status transitions to `Approved`, stock is reserved. |
| SR005-05 | Approvers can reject with mandatory reason — status transitions to `Rejected`. |
| SR005-06 | List SRs with filtering by status and requesterId, paginated and sorted by RequestDate descending. |
| SR005-07 | View SR detail with all line items, requester, and approver information. |

---

### SR006 — Purchase Requisition & Budget

**Description:** Users submit purchase requisitions (PRs) for items not available in stock. Budget allocations validate PR feasibility.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR006-01 | Create a PR with: RequesterId, RequestType, Justification, EstimatedBudget, and line items (ItemId, ItemDescription, UnitOfMeasure, Quantity, UnitCost). |
| SR006-02 | System auto-generates a unique PR number in format `PR-{YYYY}-{NNNNN}`. |
| SR006-03 | Approvers (DepartmentManager, PropertyAdmin, ProcurementOfficer) can approve or reject. |
| SR006-04 | Rejection captures a `RejectionReason`. |
| SR006-05 | PropertyAdmin can create budget allocations per: FiscalYear, Department, Division, AllocatedAmount. |
| SR006-06 | Budget allocations track UtilizedAmount with computed RemainingAmount. |
| SR006-07 | Budget allocation uniqueness: (FiscalYear, Department, Division). |

---

### SR007 — Stock Control

**Description:** Real-time inventory management with ledger-based tracking.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR007-01 | Register opening balances for items at specific shelf locations with: ItemId, ShelfId, Quantity, UnitCost, Reason. |
| SR007-02 | Perform stock adjustments: ItemId, ShelfId, QuantityChange (positive/negative), Reason. |
| SR007-03 | Every stock movement writes an immutable `StockLedger` entry with: QuantityChange, BalanceAfter, TransactionType, DocumentType, ReferenceId, ReferenceNumber, UnitCost, Reason, TransactionDate. |
| SR007-04 | `InventoryStock` tracks: CurrentQuantity, ReservedQuantity, BookBalance, PhysicalBalance, Discrepancy; computed `AvailableQuantity = CurrentQuantity - ReservedQuantity`. |
| SR007-05 | Check constraints enforce non-negative CurrentQuantity and ReservedQuantity. |
| SR007-06 | Stock uniqueness: (ItemId, ShelfId). |
| SR007-07 | View stock balances with filtering by warehouseId, itemId, propertyType; paginated. |
| SR007-08 | View item availability aggregated across all shelves. |
| SR007-09 | View low-stock items (AvailableQuantity ≤ MinStockLevel). |
| SR007-10 | View stock ledger with filtering by itemId, date range; paginated. |
| SR007-11 | Generate ECX-format tag numbers: `AFRICOM-{LocationCode}-{TypeCode}-{SequenceNumber}`. |

**Stock Transaction Types:**

| Type | Description |
|---|---|
| `OpeningBalance` | Initial stock registration |
| `Receipt` | Goods received via GRN/FARN |
| `InspectionRelease` | Stock released after passing inspection |
| `Reservation` | Stock reserved for approved store request |
| `Issue` | Stock issued via SIV/FAIV |
| `Return` | Stock returned via RMRN |
| `TransferOut` | Stock transferred out to another custodian |
| `TransferIn` | Stock received from transfer |
| `Disposal` | Stock disposed |
| `Adjustment` | Manual stock adjustment |

---

### SR009 — Property Receiving (GRN / FARN)

**Description:** Record goods receipt from suppliers. Consumables generate a GRN; fixed assets additionally generate a FARN.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR009-01 | Create a receiving note with: SupplierId, WarehouseId, ReceivedById, PurchaseRequestId (optional), InvoiceNumber, PurchaseOrderNumber, StoreRequestNumber, TenderReferenceNumber, Notes, line items (ItemId, ShelfId, Quantity, UnitCost, TagNumber, SerialNumber), and optional file attachments. |
| SR009-02 | System auto-generates GRN number (`GRN-{YYYY}-{NNNNN}`); for fixed assets, a FARN number is also generated (`FARN-{YYYY}-{NNNNN}`). |
| SR009-03 | Initial status is `Received`. If items require inspection, status transitions to `InspectionPending`. |
| SR009-04 | After inspection passes (or if no inspection required), storekeeper can release goods to stock. |
| SR009-05 | TagNumber has a unique filtered index (nullable). |
| SR009-06 | List receiving notes with status filtering, paginated. |

---

### SR0010 — Property Issuing (SIV / FAIV)

**Description:** Issue approved store request items to the requester. Consumables generate a SIV; fixed assets additionally generate a FAIV.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR0010-01 | Issue stock against an approved service request with: ServiceRequestId, IssuedById, RecipientSignature. |
| SR0010-02 | System auto-generates SIV number (`SIV-{YYYY}-{NNNNN}`); for fixed assets, FAIV number is also generated (`FAIV-{YYYY}-{NNNNN}`). |
| SR0010-03 | Issuing deducts stock from inventory and creates `UserCustody` records for the requester. |
| SR0010-04 | Each SIV is linked 1:1 to a ServiceRequest. |
| SR0010-05 | List and view issue vouchers with pagination. |

---

### SR0011 — Inspection Management

**Description:** Record inspection results on received goods.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR0011-01 | Record inspection for a receiving note with: ReceivingNoteId, InspectorId, IsPassed, DeviationNotes, optional attachments. |
| SR0011-02 | Each receiving note can have at most one inspection log (1:1 relationship). |
| SR0011-03 | Inspection pass transitions receiving note status to `InspectionPassed`; failure transitions to `InspectionFailed`. |
| SR0011-04 | List inspection logs paginated with GRN number and inspector name. |

---

### SR0012 — Property Return (RMRN)

**Description:** Staff return property items back to the warehouse.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| SR0012-01 | Create a return with: ReturnedById, Reason, line items (ItemId, ShelfId, Quantity, UnitCost, TagNumber, SerialNumber, Condition). |
| SR0012-02 | System auto-generates RMRN number (`RMRN-{YYYY}-{NNNNN}`). |
| SR0012-03 | Approval by storekeeper/admin transitions status to `Returned`; stock is added back, custody is updated. |
| SR0012-04 | Property condition is captured per line: New, FunctionalUsed, Damaged, Obsolete, NonFunctional. |

---

### FR0013 — User Custody Tracking

**Description:** Track per-user custody of property items.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0013-01 | Custody records are created automatically when items are issued (SIV/FAIV). |
| FR0013-02 | Custody records are updated when items are returned (RMRN) or transferred (RMTN). |
| FR0013-03 | Each custody record tracks: CustodianId, ItemId, Quantity, TagNumber, SerialNumber, SourceDocumentNumber. |
| FR0013-04 | View custody with filtering by custodianId and itemId, paginated. Only records with Quantity > 0 are shown. |

---

### FR0014 — Property Transfer (RMTN)

**Description:** Transfer property between custodians within the organization.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0014-01 | Create a transfer with: FromCustodianId, ToCustodianId, Reason, line items (ItemId, Quantity, TagNumber, SerialNumber), optional attachments. |
| FR0014-02 | System auto-generates RMTN number (`RMTN-{YYYY}-{NNNNN}`). |
| FR0014-03 | Approval transitions status to `Transferred`; custody is moved from source to destination custodian. |
| FR0014-04 | List and view transfers with status filtering, paginated. |

---

### FR0015 — Property Handover

**Description:** Formal handover of property between staff or locations.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0015-01 | Create a handover with: HandoverFromId, HandoverToId, Purpose, FromLocation, ToLocation, Remarks, line items (ItemId, Quantity, TagNumber, SerialNumber, FarnNumber, RmrnNumber, FaivNumber), optional attachments. |
| FR0015-02 | System auto-generates handover number. |
| FR0015-03 | Approval workflow with status transitions. |
| FR0015-04 | List and view handovers with status filtering, paginated. |

---

### FR0016 — Compliance Management

**Description:** Internal compliance reviews conducted by compliance officers.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0016-01 | Create a compliance record with: optional InventoryId (link to annual inventory), ReviewedById, Findings, Recommendations, CorrectiveActions. |
| FR0016-02 | System auto-generates a unique compliance number. |
| FR0016-03 | Compliance records can be closed with remarks. |
| FR0016-04 | List and view compliance records, paginated. |

---

### FR0017 — Stock Disposal

**Description:** Dispose of damaged, obsolete, or non-functional property.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0017-01 | Create a disposal record with: ItemId, ShelfId (optional), CustodianId (optional), Quantity, Condition, DisposalMethod (Auction/Tendering/Scrapping/Other), Notes, optional attachments. |
| FR0017-02 | System auto-generates a unique disposal number. |
| FR0017-03 | Approval transitions status to `Disposed`; stock is deducted. |
| FR0017-04 | List disposals with status filtering, paginated. |

---

### FR0018 — Safety Box Dashboard

**Description:** Safety box monitoring dashboard showing stock status per box.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0018-01 | Dashboard displays per-box aggregated data: TotalShelves, TotalItems, TotalReserved, TotalAvailable, TotalDiscrepancy. |
| FR0018-02 | Only active safety boxes are shown on the dashboard. |
| FR0018-03 | Data is computed by linking safety box shelves to shelf locations and their inventory stocks. |

---

### FR0019 — Reporting & Analytics

**Description:** Comprehensive reporting suite with document-specific and aggregated reports.

**Functional Requirements:**

| ID | Report | Filters |
|---|---|---|
| FR0019-01 | Dashboard KPIs | None (all authenticated users) |
| FR0019-02 | Stock Summary (aggregated by item) | None |
| FR0019-03 | Property Movements (ledger history) | from, to, itemId, transactionType; paginated |
| FR0019-04 | Audit Trail | from, to, entityName, userId; paginated |
| FR0019-05 | Goods Receiving Report (GRN) | from, to; paginated |
| FR0019-06 | Fixed Assets Receiving Report (FARN) | from, to; paginated |
| FR0019-07 | Goods Issuing Report (SIV) | from, to; paginated |
| FR0019-08 | Fixed Assets Issuing Report (FAIV) | from, to; paginated |
| FR0019-09 | Returns Report (RMRN) | from, to; paginated |
| FR0019-10 | Transfers Report (RMTN) | from, to; paginated |
| FR0019-11 | Purchase Requisitions Report | from, to; paginated |
| FR0019-12 | Inspection Report | from, to; paginated |
| FR0019-13 | Custody Report (Fixed Assets Registry) | custodianId; paginated |
| FR0019-14 | Disposal Report | from, to; paginated |
| FR0019-15 | Handover Report | from, to; paginated |
| FR0019-16 | Budget Utilization Report | fiscalYear |
| FR0019-17 | Annual Inventory Report | fiscalYear, location |

---

### FR0020 — Annual Physical Inventory

**Description:** Conduct annual physical inventory counts with discrepancy tracking.

**Functional Requirements:**

| ID | Requirement |
|---|---|
| FR0020-01 | Create an annual inventory with: FiscalYear, Location, CountedById, and line items (ItemId, ShelfId, ExpectedQuantity, CountedQuantity, Notes). |
| FR0020-02 | System auto-generates a unique inventory number. |
| FR0020-03 | Discrepancy is calculated per line: `CountedQuantity - ExpectedQuantity`. |
| FR0020-04 | Inventory can be completed/closed with remarks. |
| FR0020-05 | Annual inventory report shows year-over-year comparison with aggregate totals. |

---

## 4. Authentication & Security Requirements

### 4.1 Login & Account Lockout

| ID | Requirement |
|---|---|
| SEC-01 | Users authenticate with EmployeeId, UserName, and Password via `POST /api/auth/login`. |
| SEC-02 | Role is derived from the database, **not** sent by the client. |
| SEC-03 | Account lockout activates after **4 consecutive failed login attempts**. |
| SEC-04 | Lockout duration is **30 minutes**. |
| SEC-05 | Successful login resets the failed attempt counter and clears any lockout. |
| SEC-06 | All login attempts (success, failure, lockout) are recorded in the audit trail. |

### 4.2 JWT Token Lifecycle

| ID | Requirement |
|---|---|
| SEC-07 | On successful login, server issues a JWT access token and a rotation-enabled refresh token (stored in DB). |
| SEC-08 | Refresh tokens have a 7-day expiry. |
| SEC-09 | Token refresh (`POST /api/auth/refresh`) issues new access and refresh tokens, rotating the refresh token. |
| SEC-10 | Access token claims include: user ID, employee ID, username, and role. |
| SEC-11 | JWT signing uses HMAC-SHA256 with a key ≥ 32 characters. |
| SEC-12 | Token validation enforces issuer, audience, signing key, lifetime, and a 1-minute clock skew. |
| SEC-13 | `GET /api/auth/me` returns the current user's claims. |
| SEC-14 | `GET /api/auth/roles` returns all available role names. |

### 4.3 Role-Based Access Control (RBAC)

| ID | Requirement |
|---|---|
| SEC-15 | Every API endpoint (except login, refresh) requires authentication via the `[Authorize]` attribute. |
| SEC-16 | Endpoints are restricted to specific roles using `[Authorize(Roles = ...)]`. |
| SEC-17 | In development mode, a secondary header-based authentication scheme (`X-User-Id` / `X-User-Role`) is available. This scheme is **disabled in production**. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|---|---|
| NFR-01 | All list endpoints support **pagination** with configurable page size (default varies: 20 or 50). |
| NFR-02 | Database queries use `AsNoTracking()` for read-only operations. |
| NFR-03 | Stock ledger and document sequence lookups use composite indexes for efficient querying. |

### 5.2 Data Integrity

| ID | Requirement |
|---|---|
| NFR-04 | All foreign keys use `DeleteBehavior.Restrict` — no cascade deletes. |
| NFR-05 | Check constraints on `InventoryStock` enforce `CurrentQuantity >= 0` and `ReservedQuantity >= 0`. |
| NFR-06 | Unique indexes on all document numbers (SR, PR, GRN, FARN, SIV, FAIV, RMRN, RMTN, etc.). |
| NFR-07 | Filtered unique indexes on nullable columns (TagNumber, SerialNumber, RefreshToken, TIN). |
| NFR-08 | Composite unique indexes on (ItemId, ShelfId) for inventory stock, (DocumentType, Year) for sequences, (FiscalYear, Department, Division) for budgets. |
| NFR-09 | `StockLedger` entries are immutable — they serve as an append-only audit log. |

### 5.3 Audit & Traceability

| ID | Requirement |
|---|---|
| NFR-10 | Every entity has automatic audit fields: CreatedDate, UpdatedDate, CreatedBy, UpdatedBy. |
| NFR-11 | CreatedDate is set on INSERT and never modified. |
| NFR-12 | UpdatedDate is refreshed on every UPDATE. |
| NFR-13 | CreatedBy/UpdatedBy are populated from the JWT claims via middleware. |
| NFR-14 | `AuditTrail` entity explicitly logs user actions (login, approvals, etc.) with: UserId, Action, EntityName, EntityId, Details, ActionDate. |

### 5.4 Scalability

| ID | Requirement |
|---|---|
| NFR-15 | Application follows stateless design — no in-process session state for business data. |
| NFR-16 | EF Core connection pooling is configured via the connection string. |
| NFR-17 | The frontend proxy configuration supports deployment behind a reverse proxy. |

### 5.5 Usability

| ID | Requirement |
|---|---|
| NFR-18 | API documentation is available via Swagger UI in development mode at `/swagger`. |
| NFR-19 | Global exception middleware provides standardized error responses without leaking internal details. |
| NFR-20 | FluentValidation provides descriptive validation error messages on malformed requests. |
| NFR-21 | Reference loop handling is configured in JSON serialization. |

---

## 6. Data Requirements

### 6.1 Document Numbering

PAS uses auto-incrementing document sequences per fiscal year via the `DocumentSequence` entity:

| Document | Format | Example |
|---|---|---|
| Store Request | `SR-{YYYY}-{NNNNN}` | `SR-2026-00001` |
| Purchase Requisition | `PR-{YYYY}-{NNNNN}` | `PR-2026-00001` |
| Goods Receipt Note | `GRN-{YYYY}-{NNNNN}` | `GRN-2026-00001` |
| Fixed Asset Receiving Note | `FARN-{YYYY}-{NNNNN}` | `FARN-2026-00001` |
| Store Issue Voucher | `SIV-{YYYY}-{NNNNN}` | `SIV-2026-00001` |
| Fixed Asset Issue Voucher | `FAIV-{YYYY}-{NNNNN}` | `FAIV-2026-00001` |
| Return Material Return Note | `RMRN-{YYYY}-{NNNNN}` | `RMRN-2026-00001` |
| Return Material Transfer Note | `RMTN-{YYYY}-{NNNNN}` | `RMTN-2026-00001` |

### 6.2 Tag Number Convention

Tag numbers follow the AFRICOM convention:

```
AFRICOM-{LocationCode}-{TypeCode}-{SequenceNumber}
```

Example: `AFRICOM-HO-1-01-00001`

### 6.3 Enumerations

| Enum | Values |
|---|---|
| **UserRole** | Employee (1), PropertyAdmin (2), Storekeeper (3), RequisitioningStaff (4), DepartmentManager (5), Inspector (6), ComplianceOfficer (7), ReportViewer (8), ProcurementOfficer (9), FinanceOfficer (10) |
| **PropertyType** | FixedAsset (1), Consumable (2) |
| **DocumentType** | SR (1), PR (2), GRN (3), FARN (4), SIV (5), FAIV (6), RMRN (7), RMTN (8), Disposal (9), AnnualInventory (10), Handover (11), Compliance (12) |
| **WorkflowStatus** | Draft (1), Submitted (2), PendingApproval (3), Approved (4), Rejected (5), Cancelled (6), Received (7), InspectionPending (8), InspectionPassed (9), InspectionFailed (10), Issued (11), Returned (12), Transferred (13), Disposed (14), Closed (15), HandedOver (16) |
| **StockTransactionType** | OpeningBalance (1), Receipt (2), InspectionRelease (3), Reservation (4), Issue (5), Return (6), TransferOut (7), TransferIn (8), Disposal (9), Adjustment (10) |
| **RequestType** | Budgeted (1), Replacement (2), Emergency (3), Other (4) |
| **PropertyCondition** | New (1), FunctionalUsed (2), Damaged (3), Obsolete (4), NonFunctional (5) |
| **DisposalMethod** | Auction (1), Tendering (2), Scrapping (3), Other (4) |
| **FieldDataType** | Text (1), Number (2), Date (3), Boolean (4), Selection (5) |

---

## 7. External Interface Requirements

### 7.1 REST API

- Base URL: `http://localhost:5049/api`
- Data Format: JSON (application/json)
- Authentication: JWT Bearer token in `Authorization` header
- CORS: Configured for `http://localhost:4200` (Angular dev server)

### 7.2 Frontend SPA

- Base URL: `http://localhost:4200`
- Proxy: `/api` requests are proxied to the backend at `http://localhost:5049`
- Framework: Angular 19 with standalone components and lazy-loaded routes

### 7.3 Database

- Engine: SQL Server 2022+
- Connection: Configured via `ConnectionStrings:DefaultConnection`
- Views: `vw_StockSummary` (aggregated stock levels), `vw_PropertyMovement` (chronological movement ledger)
