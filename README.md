<p align="center">
  <strong>ECX PAS</strong><br/>
  <em>Property Automation System</em>
</p>

<p align="center">
  <img alt=".NET 10" src="https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white" />
  <img alt="Angular 19" src="https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white" />
  <img alt="SQL Server" src="https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-Proprietary-blue" />
</p>

---

# ECX Property Automation System (PAS)

A full-stack enterprise **Property & Inventory Management System** built for the **Ethiopia Commodity Exchange (ECX)**. PAS digitizes the complete lifecycle of organizational property — from procurement and receiving through custody tracking, inter-departmental transfers, returns, disposal, and regulatory compliance — replacing manual paper-based workflows with automated, auditable digital processes.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Database](#database)
- [Authentication & Authorization](#authentication--authorization)
- [API Documentation](#api-documentation)
- [Seed Data & Demo Accounts](#seed-data--demo-accounts)
- [Testing](#testing)
- [Document Types & Numbering](#document-types--numbering)
- [Workflow Engine](#workflow-engine)
- [Contributing](#contributing)

---

## Overview

The ECX Property Automation System (PAS) was designed per the **ECX Property Administration Procedure Manual** and a detailed Software Requirements Specification (SRS). It provides a centralized platform for property administrators, storekeepers, department managers, inspectors, compliance officers, and procurement staff to collaboratively manage the exchange's fixed assets and consumable supplies.

### Business Goals

| Goal | How PAS Addresses It |
|---|---|
| **Eliminate paper workflows** | Digital Store Requests (SR), Purchase Requisitions (PR), Goods Receipt Notes (GRN), Store Issue Vouchers (SIV/FAIV), and Return Material Return Notes (RMRN) |
| **Real-time inventory visibility** | Centralized stock control with bin-card tracking, safety-box management, and low-stock alerts |
| **Regulatory compliance** | Full audit trail, inspection logs, annual physical inventory, compliance reviews, and role-based access |
| **Cross-departmental transparency** | Role-scoped dashboards, notification events, and KPI tiles for pending actions |
| **Ethiopian calendar support** | Dual Gregorian / Ethiopian date display across the UI |

---

## Key Features

### Master Data Management
- **Categories** — Hierarchical categorization of fixed assets and consumable items
- **Item Master** — SKU-based item registry with unit cost, unit of measure, minimum stock levels, and custom property fields
- **Warehouses & Shelf Locations** — Location demography (HO, Branch, ReTC) with aisle/rack/shelf/bin addressing and QR code integration
- **Safety Box Management** — Configurable safety boxes with shelf capacity tracking (weight & volume)
- **Supplier Registry** — TIN-indexed supplier records
- **Budget Allocations** — Fiscal-year budget tracking per department/division for purchase request validation

### Workflow Modules
| Module | Document | SRS Reference |
|---|---|---|
| Store Requisitions | SR | SR005 |
| Purchase Requisitions | PR | SR006 |
| Property Receiving | GRN / FARN | SR009 |
| Inspection | Inspection Log | SR0011 |
| Property Issuing | SIV / FAIV | SR0010 |
| Property Returns | RMRN | SR0012 |
| Property Transfers | RMTN | FR0014 |
| Property Handovers | Handover Note | FR0015 |
| Stock Disposal | Disposal Record | FR0017 |
| Annual Inventory | Inventory Count | FR0020 |
| Compliance Management | Compliance Record | FR0016 |

### Stock Control (SR007)
- Opening balance registration
- Real-time stock adjustments with ledger-based double-entry tracking
- Reservation system for approved-but-not-yet-issued quantities
- Bin card management with transaction history
- Safety box dashboard with variance monitoring

### Reporting & Analytics (FR0019)
- **Dashboard KPIs** — Stock items count, low-stock alerts, pending SRs/PRs/inspections/returns/transfers/handovers/disposals
- **Stock Summary Report** — Aggregated view via `vw_StockSummary` database view
- **Property Movement Report** — Ledger-based movement history via `vw_PropertyMovement` view
- **Audit Trail Report** — Full action log with user, entity, and timestamp details
- **Notification Center** — In-app notification drawer with read/unread tracking

### User Custody (FR0013)
- Per-user custody balance validated against FARN, FAIV, RMRN, and RMTN documents
- Custody lookup by custodian, item, tag number, and serial number

---

## Architecture

The system follows **Clean Architecture** (Onion Architecture) with strict dependency inversion:

```
┌──────────────────────────────────────────────────────────────┐
│                        PMS.Web (Angular 19 SPA)              │
│  Standalone components · Lazy-loaded routes · Lucide icons   │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (JSON over REST)
┌──────────────────────▼───────────────────────────────────────┐
│                     PMS.API (.NET 10 Web API)                │
│  Controllers · JWT Auth · RBAC · Global Exception Middleware │
│  Swagger/OpenAPI · CORS · Audit Middleware                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                  PMS.Application (Use Cases)                 │
│  CQRS (MediatR) · DTOs · FluentValidation · AutoMapper      │
│  Validation Pipeline Behavior · Workflow Service Contract    │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    PMS.Domain (Core)                         │
│  Entities · Enums · Base Entity (audit fields)               │
│  No external dependencies                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                 PMS.Persistence (Infrastructure)             │
│  EF Core 10 · SQL Server · Generic Repository · Migrations  │
│  Workflow Service · Seed Data · Audit Field Interceptor      │
└──────────────────────────────────────────────────────────────┘
```

### Frontend Architecture (PMS.Web)

```
src/app/
├── core/           # Auth guard, interceptors, API services, models, utils
├── features/       # 17 feature modules (lazy-loaded standalone components)
├── layout/         # Main layout shell: sidebar, topbar, breadcrumb, footer
└── shared/         # Reusable components, directives, pipes
```

**Shared Component Library:** Button, Input, Select, Data Table, Status Badge, KPI Tile, Confirm Dialog, File Uploader, QR Scanner, Safety Box Visualizer, Icon (Lucide)

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| .NET | 10.0 | Runtime & Web API framework |
| ASP.NET Core | 10.0 | HTTP pipeline, controllers, middleware |
| Entity Framework Core | 10.0.7 | ORM with Code-First migrations |
| SQL Server | 2022+ | Relational database |
| MediatR | Latest | CQRS command/query dispatching |
| FluentValidation | Latest | Request validation pipeline |
| AutoMapper | Latest | Entity ↔ DTO mapping |
| BCrypt.Net | Latest | Password hashing |
| JWT Bearer | 10.0.7 | Token-based authentication |
| Swashbuckle | 10.1.7 | OpenAPI / Swagger documentation |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Angular | 19.x | SPA framework with standalone components |
| TypeScript | 5.6 | Type-safe JavaScript |
| RxJS | 7.8 | Reactive state & HTTP handling |
| Lucide Angular | 1.x | Icon library |
| Zone.js | 0.15 | Angular change detection |

### Testing
| Technology | Purpose |
|---|---|
| xUnit | Backend unit/integration tests |
| Microsoft.AspNetCore.Mvc.Testing | WebApplicationFactory integration tests |
| EF Core InMemory | In-memory database for test isolation |
| Coverlet | Code coverage collection |
| Karma + Jasmine | Frontend unit tests |

---

## Project Structure

```
PMS/
├── PMS.sln                              # Visual Studio solution
│
├── PMS.Domain/                          # Domain layer (zero dependencies)
│   ├── Common/BaseDomainEntity.cs       # Base entity: Id, CreatedDate, UpdatedDate, CreatedBy, UpdatedBy
│   ├── Entities/PasEntities.cs          # ~30 domain entities
│   └── Enums/PasEnums.cs               # UserRole, WorkflowStatus, DocumentType, PropertyCondition, etc.
│
├── PMS.Application/                     # Application layer
│   ├── CQRS/                            # MediatR commands (MasterData, Workflow)
│   ├── Contracts/                       # IGenericRepository<T>, IPasWorkflowService
│   ├── DTO/PasDtos.cs                   # ~40 request/response records
│   ├── Validators/                      # FluentValidation validators
│   ├── Profiles/MappingProfile.cs       # AutoMapper mappings
│   ├── Behaviors/                       # MediatR validation pipeline behavior
│   └── Exceptions/                      # BusinessRuleException
│
├── PMS.Persistence/                     # Infrastructure layer
│   ├── PMSDbContext.cs                  # EF Core DbContext (35+ DbSets, Fluent API config)
│   ├── Repository/GenericRepository.cs  # Generic CRUD + pagination
│   ├── Services/
│   │   ├── PasWorkflowService.cs        # Core workflow engine (~55 KB)
│   │   └── PasSeedData.cs              # Demo data seeder
│   └── Migrations/                      # EF Core migrations + SQL view scripts
│
├── PMS.API/                             # Presentation layer
│   ├── Controllers/                     # 18 API controllers
│   ├── Authentication/                  # JWT service, options, header auth handler
│   ├── Authorization/PasRoles.cs        # Role-based access constants
│   ├── Middleware/                       # GlobalExceptionMiddleware, AuditUserMiddleware
│   ├── Filters/                         # FluentValidation action filter
│   └── Program.cs                       # App startup & DI composition root
│
├── PMS.Tests/                           # Test project
│   ├── PasWorkflowServiceTests.cs       # Workflow integration tests
│   └── SwaggerTests.cs                  # API endpoint smoke tests
│
└── PMS.Web/                             # Angular 19 SPA
    ├── src/app/
    │   ├── core/                        # Auth (guard, store, service), interceptors, 16 API services, models
    │   ├── features/                    # 17 feature modules (dashboard, admin, master-data, receiving, ...)
    │   ├── layout/                      # Sidebar, topbar, breadcrumb, footer
    │   └── shared/                      # 11 reusable components, directives, pipes
    └── proxy.conf.json                  # Dev proxy → API at localhost:5049
```

---

## Prerequisites

| Dependency | Minimum Version |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 |
| [Node.js](https://nodejs.org/) | 20.x LTS |
| [SQL Server](https://www.microsoft.com/en-us/sql-server) | 2019+ (LocalDB, Express, or full) |
| [Angular CLI](https://angular.dev/tools/cli) | 19.x (`npm i -g @angular/cli`) |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hamouzei/PMS.git
cd PMS
```

### 2. Configure the Backend

Store secrets securely using [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets):

```bash
cd PMS.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\mssqllocaldb;Database=PMS_Dev;Trusted_Connection=True;MultipleActiveResultSets=true"
dotnet user-secrets set "Jwt:SigningKey" "YourSuperSecretKeyAtLeast32CharsLong!!"
```

### 3. Apply Database Migrations

```bash
cd PMS.API
dotnet ef database update --project ../PMS.Persistence
```

Optionally, create the reporting views:

```bash
sqlcmd -S "(localdb)\mssqllocaldb" -d PMS_Dev -i PMS.Persistence/Migrations/CreateDatabaseViews.sql
```

### 4. Seed Demo Data (Optional)

Set the seed flag in `appsettings.Development.json` or via environment variable:

```json
{
  "SeedData": {
    "ApplyOnStartup": true
  }
}
```

### 5. Start the Backend

```bash
cd PMS.API
dotnet run
```

The API will be available at `http://localhost:5049` with Swagger UI at `/swagger`.

### 6. Start the Frontend

```bash
cd PMS.Web
npm install
ng serve
```

The Angular app will be available at `http://localhost:4200` and proxies `/api` requests to the backend.

---

## Configuration

### Environment Variables / User Secrets

| Key | Required | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | ✅ | SQL Server connection string |
| `Jwt:SigningKey` | ✅ | HMAC-SHA256 signing key (≥ 32 chars) |
| `Jwt:Issuer` | ❌ | Token issuer (default: `PMS`) |
| `Jwt:Audience` | ❌ | Token audience (default: `PMS.Client`) |
| `Jwt:ExpiryMinutes` | ❌ | Access token lifetime (default: `120`) |
| `SeedData:ApplyOnStartup` | ❌ | Seed demo data on startup (default: `false`) |
| `Cors:AllowedOrigin` | ❌ | Additional CORS origin (default: `http://localhost:4200`) |

---

## Database

### Entity Relationship Overview

The database consists of **35+ tables** organized by functional domain:

| Domain | Key Tables |
|---|---|
| **Master Data** | `Categories`, `ItemMasters`, `Warehouses`, `ShelfLocations`, `Suppliers`, `PropertyFields`, `PropertyFieldValues` |
| **Users & Auth** | `Users` (AppUser) |
| **Safety Box** | `SafetyBoxes`, `SafetyBoxShelves` |
| **Stock Control** | `InventoryStocks`, `StockLedgers` |
| **Requisitions** | `ServiceRequests`, `ServiceRequestDetails`, `PurchaseRequests`, `PurchaseRequestDetails` |
| **Receiving** | `ReceivingNotes`, `ReceivingNoteDetails`, `InspectionLogs` |
| **Issuing** | `StoreIssueVouchers`, `StoreIssueVoucherDetails` |
| **Returns** | `PropertyReturns`, `PropertyReturnDetails` |
| **Transfers** | `PropertyTransfers`, `PropertyTransferDetails` |
| **Handovers** | `PropertyHandovers`, `PropertyHandoverDetails` |
| **Custody** | `UserCustodies` |
| **Disposal** | `DisposalRecords` |
| **Inventory** | `AnnualInventories`, `AnnualInventoryLines` |
| **Compliance** | `ComplianceRecords` |
| **Budget** | `BudgetAllocations` |
| **System** | `DocumentSequences`, `DocumentAttachments`, `NotificationEvents`, `AuditTrails` |

### Database Views

| View | Purpose |
|---|---|
| `vw_StockSummary` | Aggregated stock levels per item |
| `vw_PropertyMovement` | Chronological property movement ledger |

### Data Integrity Features

- **Check constraints** on `InventoryStock` (non-negative quantities)
- **Unique indexes** on all document numbers (SR, PR, GRN, FARN, SIV, FAIV, RMRN, RMTN, etc.)
- **Filtered unique indexes** on nullable columns (TagNumber, SerialNumber, RefreshToken, TIN)
- **Restrict delete behavior** on all foreign keys
- **Automatic audit fields** (CreatedDate, UpdatedDate, CreatedBy, UpdatedBy) via `SaveChangesAsync` interceptor

---

## Authentication & Authorization

### Authentication Flow

1. User submits `EmployeeId`, `UserName`, and `Password` to `POST /api/auth/login`
2. Server validates credentials against BCrypt-hashed passwords
3. **Account lockout** activates after **4 failed attempts** (per SRS Login §1.4)
4. On success, server issues a JWT access token and a rotation-enabled refresh token
5. Refresh tokens are stored in the database with expiry tracking

### Role-Based Access Control (RBAC)

| Role | Scope |
|---|---|
| `PropertyAdmin` | Full system access — master data, all workflows, reports |
| `Storekeeper` | Receiving, stock control, issuing, returns, transfers |
| `DepartmentManager` | Approve requisitions, view custody, reports |
| `RequisitioningStaff` | Submit store/purchase requests |
| `Inspector` | Record inspections on received goods |
| `ComplianceOfficer` | Compliance reviews, audit trail reports |
| `ProcurementOfficer` | Purchase requisition workflows |
| `FinanceOfficer` | Financial reports and budget views |
| `ReportViewer` | Read-only report access |
| `Employee` | Submit requests and view own custody |

### Development Authentication

In development mode, a secondary **header-based authentication** scheme (`X-User-Id` / `X-User-Role`) is available for rapid API testing without JWT tokens. This scheme is **disabled in production** builds.

---

## API Documentation

When running in development mode, interactive API documentation is available via **Swagger UI**:

```
http://localhost:5049/swagger
```

### API Controller Summary

| Controller | Endpoint Prefix | Responsibilities |
|---|---|---|
| `AuthController` | `/api/auth` | Login, refresh, token management |
| `AdminController` | `/api/admin` | User CRUD, password reset |
| `MasterDataController` | `/api/master-data` | Categories, items, warehouses, shelves, suppliers, fields, budget |
| `SafetyBoxController` | `/api/safety-boxes` | Safety box and shelf management |
| `StockController` | `/api/stock` | Opening balances, adjustments, ledger queries, low-stock alerts |
| `StoreRequestsController` | `/api/store-requests` | SR create, approve, reject, list |
| `PurchaseRequestsController` | `/api/purchase-requests` | PR create, approve, reject, list |
| `ReceivingController` | `/api/receiving` | GRN/FARN creation, inspection, stock release |
| `InspectionController` | `/api/inspections` | Inspection log recording |
| `IssuingController` | `/api/issuing` | SIV/FAIV generation from approved SRs |
| `CustodyController` | `/api/custody` | User custody balance queries |
| `ReturnsController` | `/api/returns` | RMRN creation and approval |
| `TransfersController` | `/api/transfers` | RMTN creation and approval |
| `HandoverController` | `/api/handovers` | Property handover workflows |
| `DisposalController` | `/api/disposal` | Asset disposal (auction, tendering, scrapping) |
| `AnnualInventoryController` | `/api/annual-inventory` | Physical inventory counts |
| `ComplianceController` | `/api/compliance` | Compliance review records |
| `ReportsController` | `/api/reports` | KPIs, stock summary, movements, audit trail, notifications |

---

## Seed Data & Demo Accounts

When `SeedData:ApplyOnStartup` is `true`, the system seeds the following demo data:

### Users

| Employee ID | Username | Role | Password |
|---|---|---|---|
| `PAS-ADMIN` | `admin` | Property Admin | `Pass@123` |
| `PAS-STORE` | `storekeeper` | Storekeeper | `Pass@123` |
| `PAS-REQ` | `requester` | Requisitioning Staff | `Pass@123` |
| `PAS-MGR` | `manager` | Department Manager | `Pass@123` |
| `PAS-INSP` | `inspector` | Inspector | `Pass@123` |
| `PAS-COMP` | `compliance` | Compliance Officer | `Pass@123` |

### Reference Data

- **Categories:** Fixed Assets, Consumables
- **Items:** Laptop Computer (FA-LAP-001), A4 Paper Ream (CON-PAP-001)
- **Warehouse:** Head Office Central Store (ECX-HO)
- **Shelf Locations:** Two shelves with QR codes
- **Supplier:** Demo Supplier PLC
- **Opening Stock:** 5 laptops, 100 paper reams

---

## Testing

### Backend Tests

```bash
cd PMS.Tests
dotnet test
```

The test suite includes:
- **Workflow integration tests** (`PasWorkflowServiceTests.cs`) — Validates end-to-end workflow operations using EF Core InMemory provider
- **Swagger/API smoke tests** (`SwaggerTests.cs`) — Verifies API endpoint registration via `WebApplicationFactory`

### Frontend Tests

```bash
cd PMS.Web
ng test
```

---

## Document Types & Numbering

PAS uses auto-incrementing document sequences per fiscal year:

| Code | Document | Format Example |
|---|---|---|
| `SR` | Store Request | `SR-2026-00001` |
| `PR` | Purchase Requisition | `PR-2026-00001` |
| `GRN` | Goods Receipt Note | `GRN-2026-00001` |
| `FARN` | Fixed Asset Receiving Note | `FARN-2026-00001` |
| `SIV` | Store Issued Voucher | `SIV-2026-00001` |
| `FAIV` | Fixed Asset Issue Voucher | `FAIV-2026-00001` |
| `RMRN` | Return Material Return Note | `RMRN-2026-00001` |
| `RMTN` | Return Material Transfer Note | `RMTN-2026-00001` |

Tag numbers follow the ECX convention: `ECX-{LocationCode}-{TypeCode}-{SequenceNumber}` (e.g., `ECX-HO-1-01-00001`).

---

## Workflow Engine

The `PasWorkflowService` is the central orchestrator for all business workflows. Each workflow follows a consistent state-machine pattern:

```
Draft → Submitted → PendingApproval → Approved / Rejected
                                         ↓
                              (downstream actions)
                    InspectionPending → InspectionPassed / Failed
                              Issued → Returned / Transferred
                                         → Disposed / Closed
```

### Key Workflow Behaviors

- **Stock reservation** — Approved store requests reserve inventory; issuing commits the deduction
- **Ledger tracking** — Every stock movement writes an immutable `StockLedger` entry
- **Custody management** — Issuing creates `UserCustody` records; returns and transfers update them
- **Auto-numbering** — Document numbers are generated atomically via `DocumentSequence`
- **Notifications** — Workflow transitions create `NotificationEvent` records for affected parties
- **Inspection gating** — Items flagged `RequiresInspection` must pass inspection before stock release

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear, descriptive messages
4. Push to your fork and open a Pull Request
5. Ensure all tests pass (`dotnet test` and `ng test`)

---

<p align="center">
  <sub>Built for the Ethiopia Commodity Exchange · Addis Ababa, Ethiopia</sub>
</p>
