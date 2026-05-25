using PMS.Domain.Enums;

namespace PMS.Application.DTO;

// ── Shared ───────────────────────────────────────────────────────────────────

public record AttachmentRequest(
    string FileName,
    string? ContentType,
    string StoragePath,
    Guid? UploadedById);

public record DocumentResult(
    Guid Id,
    string Number,
    WorkflowStatus Status);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount);

public record PaginationFilter(int PageNumber = 1, int PageSize = 20)
{
    public int Skip => (PageNumber - 1) * PageSize;
}

public record DateRangeFilter(DateTime? From, DateTime? To);

public record StockFilter(
    Guid? ItemId,
    Guid? ShelfId,
    Guid? WarehouseId,
    string? PropertyType,
    string? Location,
    string? TagNumber,
    string? SerialNumber,
    DateTime? From,
    DateTime? To,
    int PageNumber = 1,
    int PageSize = 50);

public record SearchFilter(string? Query, int MaxResults = 25);

// ── Login / Auth (SRS Login §1) ──────────────────────────────────────────────
// Role removed from request — derived from DB per SRS
public record LoginRequest(
    string EmployeeId,
    string UserName,
    string Password);

public record LoginResponse(
    string Scheme,
    string EmployeeId,
    string UserName,
    string Role,
    string Token,
    Guid RefreshToken,
    DateTime RefreshTokenExpiresAt,
    string[] RequiredHeaders);

public record RefreshTokenRequest(Guid RefreshToken);

// ── Master Data: Categories (SR003) ──────────────────────────────────────────

public record CreateCategoryRequest(
    string Name,
    string? Description,
    Guid? ParentCategoryId);

// ── Master Data: Items (SR003) ───────────────────────────────────────────────

public record CreateItemRequest(
    string Sku,
    string ItemName,
    string? Description,
    Guid CategoryId,
    PropertyType PropertyType,
    string UnitOfMeasure,
    bool RequiresInspection,
    int MinStockLevel,
    decimal UnitCost);

// ── Master Data: Users (SR002 Admin) ─────────────────────────────────────────

public record CreateUserRequest(
    string EmployeeId,
    string UserName,
    string FullName,
    string Password,
    UserRole Role,
    string? Department,
    string? Division,
    string? Location,
    string? Title);

public record UpdateUserRequest(
    string? FullName,
    UserRole? Role,
    string? Department,
    string? Division,
    string? Location,
    string? Title,
    bool? IsActive);

public record ResetPasswordRequest(string NewPassword);

public record AppUserDto(
    Guid Id,
    string EmployeeId,
    string UserName,
    string FullName,
    UserRole Role,
    string? Department,
    string? Division,
    string? Location,
    string? Title,
    bool IsActive);

// ── Master Data: Warehouses & Shelves (SR003 Location Demography) ────────────

public record CreateWarehouseRequest(
    string WarehouseName,
    string LocationCode,
    string? LocationType,
    string? Address,
    Guid? ParentWarehouseId);

public record CreateShelfLocationRequest(
    Guid WarehouseId,
    string? Aisle,
    string? Rack,
    string ShelfNumber,
    string? Bin,
    string QrCodeValue,
    decimal? Capacity);

// ── Master Data: Suppliers (SR009) ───────────────────────────────────────────

public record CreateSupplierRequest(
    string SupplierName,
    string? ContactPerson,
    string? TinNumber,
    string? PhoneNumber,
    string? Email);

// ── Safety Box (SR004 / FR0018) ──────────────────────────────────────────────

public record CreateSafetyBoxRequest(
    string BoxNumber,
    Guid WarehouseId,
    string? Description,
    string? Category,
    int TotalShelves);

public record CreateSafetyBoxShelfRequest(
    Guid SafetyBoxId,
    string ShelfLabel,
    decimal? WeightCapacity,
    decimal? VolumeCapacity,
    Guid? ShelfLocationId);

// ── Custom Property Fields (SR003) ───────────────────────────────────────────

public record CreatePropertyFieldRequest(
    string FieldName,
    FieldDataType FieldType,
    bool IsRequired,
    PropertyType? ApplicablePropertyType,
    int DisplayOrder,
    string? Options);

public record SetPropertyFieldValueRequest(
    Guid PropertyFieldId,
    Guid ItemId,
    string Value);

// ── Stock Operations (SR007) ─────────────────────────────────────────────────

public record StockLineRequest(
    Guid ItemId,
    Guid? ShelfId,
    int Quantity,
    decimal? UnitCost,
    string? TagNumber,
    string? SerialNumber,
    string? Remarks);

public record RegisterOpeningBalanceRequest(
    Guid ItemId,
    Guid ShelfId,
    int Quantity,
    decimal? UnitCost,
    string? Reason);

public record StockAdjustmentRequest(
    Guid ItemId,
    Guid ShelfId,
    int QuantityChange,
    string Reason);

// ── Store Requisition (SR005) ────────────────────────────────────────────────

public record CreateStoreRequestRequest(
    Guid RequesterId,
    RequestType RequestType,
    string? Reason,
    IReadOnlyList<StockLineRequest> Details);

// ── Purchase Requisition (SR006) ─────────────────────────────────────────────

public record CreatePurchaseRequestRequest(
    Guid RequesterId,
    RequestType RequestType,
    string? Justification,
    decimal? EstimatedBudget,
    IReadOnlyList<StockLineRequest> Details);

// ── Property Receiving (SR009) ───────────────────────────────────────────────

public record CreateReceivingNoteRequest(
    Guid SupplierId,
    Guid WarehouseId,
    Guid ReceivedById,
    Guid? PurchaseRequestId,
    string? InvoiceNumber,
    string? PurchaseOrderNumber,
    string? StoreRequestNumber,
    string? TenderReferenceNumber,
    string? Notes,
    IReadOnlyList<StockLineRequest> Details,
    IReadOnlyList<AttachmentRequest>? Attachments);

// ── Inspection (SR0011) ──────────────────────────────────────────────────────

public record RecordInspectionRequest(
    Guid ReceivingNoteId,
    Guid InspectorId,
    bool IsPassed,
    string? DeviationNotes,
    IReadOnlyList<AttachmentRequest>? Attachments);

public record ReleaseReceivingRequest(
    Guid ReceivingNoteId,
    Guid ReleasedById);

// ── Approval / Rejection (shared) ────────────────────────────────────────────

public record ApproveRequest(
    Guid ActorId,
    string? Remark);

public record RejectRequest(
    Guid ActorId,
    string Reason);

// ── Property Issuing (SR0010) ────────────────────────────────────────────────

public record IssueStockRequest(
    Guid ServiceRequestId,
    Guid IssuedById,
    string? RecipientSignature);

// ── Property Return (SR0012) ─────────────────────────────────────────────────

public record CreateReturnRequest(
    Guid ReturnedById,
    string? Reason,
    IReadOnlyList<ReturnLineRequest> Details,
    IReadOnlyList<AttachmentRequest>? Attachments);

public record ReturnLineRequest(
    Guid ItemId,
    Guid ShelfId,
    int Quantity,
    decimal? UnitCost,
    string? TagNumber,
    string? SerialNumber,
    PropertyCondition Condition);

// ── Property Transfer (FR0014) ───────────────────────────────────────────────

public record CreateTransferRequest(
    Guid FromCustodianId,
    Guid ToCustodianId,
    string? Reason,
    IReadOnlyList<TransferLineRequest> Details,
    IReadOnlyList<AttachmentRequest>? Attachments);

public record TransferLineRequest(
    Guid ItemId,
    int Quantity,
    string? TagNumber,
    string? SerialNumber);

// ── Property Handover (FR0015) ───────────────────────────────────────────────

public record CreateHandoverRequest(
    Guid HandoverFromId,
    Guid HandoverToId,
    string? Purpose,
    string? FromLocation,
    string? ToLocation,
    string? Remarks,
    IReadOnlyList<HandoverLineRequest> Details,
    IReadOnlyList<AttachmentRequest>? Attachments);

public record HandoverLineRequest(
    Guid ItemId,
    int Quantity,
    string? TagNumber,
    string? SerialNumber,
    string? FarnNumber,
    string? RmrnNumber,
    string? FaivNumber);

// ── Disposal (FR0017) ────────────────────────────────────────────────────────

public record CreateDisposalRequest(
    Guid ItemId,
    Guid? ShelfId,
    Guid? CustodianId,
    int Quantity,
    PropertyCondition Condition,
    DisposalMethod DisposalMethod,
    string? Notes,
    IReadOnlyList<AttachmentRequest>? Attachments);

// ── Annual Inventory (FR0020) ────────────────────────────────────────────────

public record CreateAnnualInventoryRequest(
    int FiscalYear,
    string Location,
    Guid CountedById,
    IReadOnlyList<AnnualInventoryLineRequest> Lines);

public record AnnualInventoryLineRequest(
    Guid ItemId,
    Guid? ShelfId,
    int ExpectedQuantity,
    int CountedQuantity,
    string? Notes);

// ── Compliance (FR0016) ──────────────────────────────────────────────────────

public record CreateComplianceRecordRequest(
    Guid? InventoryId,
    Guid ReviewedById,
    string? Findings,
    string? Recommendations,
    string? CorrectiveActions);

// ── Budget (SR006) ───────────────────────────────────────────────────────────

public record CreateBudgetAllocationRequest(
    int FiscalYear,
    string? Department,
    string? Division,
    decimal AllocatedAmount);
