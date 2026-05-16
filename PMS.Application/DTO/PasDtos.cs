using PMS.Domain.Enums;

namespace PMS.Application.DTO;

public record AttachmentRequest(
    string FileName,
    string? ContentType,
    string StoragePath,
    Guid? UploadedById);

public record CreateCategoryRequest(
    string Name,
    string? Description,
    Guid? ParentCategoryId);

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

public record CreateUserRequest(
    string EmployeeId,
    string UserName,
    string FullName,
    UserRole Role,
    string? Department,
    string? Division,
    string? Location,
    string? Title);

public record CreateWarehouseRequest(
    string WarehouseName,
    string LocationCode,
    string? LocationType,
    string? Address);

public record CreateShelfLocationRequest(
    Guid WarehouseId,
    string? Aisle,
    string? Rack,
    string ShelfNumber,
    string? Bin,
    string QrCodeValue,
    decimal? Capacity);

public record CreateSupplierRequest(
    string SupplierName,
    string? ContactPerson,
    string? TinNumber,
    string? PhoneNumber,
    string? Email);

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

public record CreateStoreRequestRequest(
    Guid RequesterId,
    RequestType RequestType,
    string? Reason,
    IReadOnlyList<StockLineRequest> Details);

public record CreatePurchaseRequestRequest(
    Guid RequesterId,
    RequestType RequestType,
    string? Justification,
    decimal? EstimatedBudget,
    IReadOnlyList<StockLineRequest> Details);

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

public record RecordInspectionRequest(
    Guid ReceivingNoteId,
    Guid InspectorId,
    bool IsPassed,
    string? DeviationNotes,
    IReadOnlyList<AttachmentRequest>? Attachments);

public record ReleaseReceivingRequest(
    Guid ReceivingNoteId,
    Guid ReleasedById);

public record ApproveRequest(
    Guid ActorId,
    string? Remark);

public record RejectRequest(
    Guid ActorId,
    string Reason);

public record IssueStockRequest(
    Guid ServiceRequestId,
    Guid IssuedById,
    string? RecipientSignature);

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

public record CreateDisposalRequest(
    Guid ItemId,
    Guid? ShelfId,
    Guid? CustodianId,
    int Quantity,
    PropertyCondition Condition,
    DisposalMethod DisposalMethod,
    string? Notes,
    IReadOnlyList<AttachmentRequest>? Attachments);

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

public record LoginRequest(
    string EmployeeId,
    string UserName,
    UserRole Role);

public record LoginResponse(
    string Scheme,
    string EmployeeId,
    string UserName,
    string Role,
    string[] RequiredHeaders);

public record DocumentResult(
    Guid Id,
    string Number,
    WorkflowStatus Status);
