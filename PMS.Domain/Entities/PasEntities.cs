using System.ComponentModel.DataAnnotations.Schema;
using PMS.Domain.Common;
using PMS.Domain.Enums;

namespace PMS.Domain.Entities;

// ── SR003: Property Categorization ──────────────────────────────────────────
public class Category : BaseDomainEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = [];
    public ICollection<ItemMaster> Items { get; set; } = [];
}

// ── SR003: Item Master (property types, fields) ─────────────────────────────
public class ItemMaster : BaseDomainEntity
{
    public string Sku { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public PropertyType PropertyType { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public bool RequiresInspection { get; set; }
    public int MinStockLevel { get; set; }
    public decimal UnitCost { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<InventoryStock> Stocks { get; set; } = [];
    public ICollection<StockLedger> Ledgers { get; set; } = [];
    public ICollection<PropertyFieldValue> FieldValues { get; set; } = [];
}

// ── Login Page §1.4: Account lockout after 4 failed attempts ─────────────────
public class AppUser : BaseDomainEntity
{
    public string EmployeeId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Department { get; set; }
    public string? Division { get; set; }
    public string? Location { get; set; }
    public string? Title { get; set; }
    public Guid? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    // SRS Login §1.4 — lock after 4 failed attempts
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
}

// ── SR003: Location Demography ───────────────────────────────────────────────
public class Warehouse : BaseDomainEntity
{
    public string WarehouseName { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string? LocationType { get; set; } // HO, Branch, ReTC
    public string? Address { get; set; }
    public Guid? ParentWarehouseId { get; set; }
    public Warehouse? ParentWarehouse { get; set; }
    public ICollection<Warehouse> ChildLocations { get; set; } = [];
    public ICollection<ShelfLocation> Shelves { get; set; } = [];
    public ICollection<SafetyBox> SafetyBoxes { get; set; } = [];
}

public class ShelfLocation : BaseDomainEntity
{
    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public string? Aisle { get; set; }
    public string? Rack { get; set; }
    public string ShelfNumber { get; set; } = string.Empty;
    public string? Bin { get; set; }
    public string QrCodeValue { get; set; } = string.Empty;
    public decimal? Capacity { get; set; }
    public ICollection<InventoryStock> Stocks { get; set; } = [];
    public ICollection<StockLedger> Ledgers { get; set; } = [];

    [NotMapped]
    public string FullAddress => string.Join(
        "-",
        new[] { Warehouse?.LocationCode, Aisle, Rack, ShelfNumber, Bin }
            .Where(value => !string.IsNullOrWhiteSpace(value)));
}

// ── SR004 + FR0018: Safety Box Management ────────────────────────────────────
public class SafetyBox : BaseDomainEntity
{
    public string BoxNumber { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; } // per working manual
    public int TotalShelves { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<SafetyBoxShelf> Shelves { get; set; } = [];
}

public class SafetyBoxShelf : BaseDomainEntity
{
    public Guid SafetyBoxId { get; set; }
    public SafetyBox? SafetyBox { get; set; }
    public string ShelfLabel { get; set; } = string.Empty;
    public decimal? WeightCapacity { get; set; }
    public decimal? VolumeCapacity { get; set; }
    public Guid? ShelfLocationId { get; set; }
    public ShelfLocation? ShelfLocation { get; set; }
}

// ── SR003: Custom Property Fields ────────────────────────────────────────────
public class PropertyField : BaseDomainEntity
{
    public string FieldName { get; set; } = string.Empty;
    public FieldDataType FieldType { get; set; } = FieldDataType.Text;
    public bool IsRequired { get; set; }
    public PropertyType? ApplicablePropertyType { get; set; }
    public int DisplayOrder { get; set; }
    public string? Options { get; set; } // JSON array for Selection type
    public bool IsActive { get; set; } = true;
    public ICollection<PropertyFieldValue> Values { get; set; } = [];
}

public class PropertyFieldValue : BaseDomainEntity
{
    public Guid PropertyFieldId { get; set; }
    public PropertyField? PropertyField { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public string Value { get; set; } = string.Empty;
}

// ── SR007: Stock Control ─────────────────────────────────────────────────────
public class InventoryStock : BaseDomainEntity
{
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int CurrentQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int BookBalance { get; set; }
    public int PhysicalBalance { get; set; }
    public int Discrepancy { get; set; }
    public DateTime? LastCountedAt { get; set; }

    [NotMapped]
    public int AvailableQuantity => CurrentQuantity - ReservedQuantity;
}

public class StockLedger : BaseDomainEntity
{
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int QuantityChange { get; set; }
    public int BalanceAfter { get; set; }
    public StockTransactionType TransactionType { get; set; }
    public DocumentType? DocumentType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceNumber { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Reason { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
}

// ── SR009: Supplier ──────────────────────────────────────────────────────────
public class Supplier : BaseDomainEntity
{
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? TinNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
}

// ── Shared: Document Attachments ─────────────────────────────────────────────
public class DocumentAttachment : BaseDomainEntity
{
    public DocumentType DocumentType { get; set; }
    public Guid ReferenceId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public Guid? UploadedById { get; set; }
    public AppUser? UploadedBy { get; set; }
}

// ── SR001: Notifications ─────────────────────────────────────────────────────
public class NotificationEvent : BaseDomainEntity
{
    public Guid? RecipientId { get; set; }
    public AppUser? Recipient { get; set; }
    public UserRole? RecipientRole { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? ReferenceNumber { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}

// ── FR0019: Audit Trail ──────────────────────────────────────────────────────
public class AuditTrail : BaseDomainEntity
{
    public Guid? UserId { get; set; }
    public AppUser? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime ActionDate { get; set; } = DateTime.UtcNow;
}

// ── Shared: Document sequence for auto-numbering ─────────────────────────────
public class DocumentSequence : BaseDomainEntity
{
    public DocumentType DocumentType { get; set; }
    public int Year { get; set; }
    public int NextNumber { get; set; } = 1;
}

// ── SR005: Store Requisition ─────────────────────────────────────────────────
public class ServiceRequest : BaseDomainEntity
{
    public string SrNumber { get; set; } = string.Empty;
    public Guid RequesterId { get; set; }
    public AppUser? Requester { get; set; }
    public Guid? ApprovedById { get; set; }
    public AppUser? ApprovedBy { get; set; }
    public Guid? AuthorizedById { get; set; }
    public AppUser? AuthorizedBy { get; set; }
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public RequestType RequestType { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public string? Reason { get; set; }
    public string? SupervisorRemark { get; set; }
    public ICollection<ServiceRequestDetail> Details { get; set; } = [];
    public StoreIssueVoucher? IssueVoucher { get; set; }
}

public class ServiceRequestDetail : BaseDomainEntity
{
    public Guid ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid? ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int RequestedQty { get; set; }
    public int ApprovedQty { get; set; }
    public int IssuedQty { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Remarks { get; set; }
}

// ── SR006: Purchase Requisition ──────────────────────────────────────────────
public class PurchaseRequest : BaseDomainEntity
{
    public string PrNumber { get; set; } = string.Empty;
    public Guid RequesterId { get; set; }
    public AppUser? Requester { get; set; }
    public Guid? ApprovedById { get; set; }
    public AppUser? ApprovedBy { get; set; }
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public RequestType RequestType { get; set; }
    public string? Justification { get; set; }
    public decimal? EstimatedBudget { get; set; }
    public string? RejectionReason { get; set; }
    public ICollection<PurchaseRequestDetail> Details { get; set; } = [];
}

public class PurchaseRequestDetail : BaseDomainEntity
{
    public Guid PurchaseRequestId { get; set; }
    public PurchaseRequest? PurchaseRequest { get; set; }
    public Guid? ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public string ItemDescription { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
}

// ── SR009: Property Receiving Management ─────────────────────────────────────
public class ReceivingNote : BaseDomainEntity
{
    public string GrnNumber { get; set; } = string.Empty;
    public string? FarnNumber { get; set; }
    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    public Guid ReceivedById { get; set; }
    public AppUser? ReceivedBy { get; set; }
    public Guid? ApprovedById { get; set; }
    public AppUser? ApprovedBy { get; set; }
    public Guid? PurchaseRequestId { get; set; }
    public PurchaseRequest? PurchaseRequest { get; set; }
    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Received;
    public string? InvoiceNumber { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public string? StoreRequestNumber { get; set; }
    public string? TenderReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public ICollection<ReceivingNoteDetail> Details { get; set; } = [];
    public InspectionLog? InspectionLog { get; set; }
}

public class ReceivingNoteDetail : BaseDomainEntity
{
    public Guid ReceivingNoteId { get; set; }
    public ReceivingNote? ReceivingNote { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid? ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int QuantityReceived { get; set; }
    public decimal UnitCost { get; set; }
    public string? TagNumber { get; set; }
    public string? SerialNumber { get; set; }
}

// ── SR0011: Inspection ───────────────────────────────────────────────────────
public class InspectionLog : BaseDomainEntity
{
    public Guid ReceivingNoteId { get; set; }
    public ReceivingNote? ReceivingNote { get; set; }
    public Guid InspectorId { get; set; }
    public AppUser? Inspector { get; set; }
    public bool IsPassed { get; set; }
    public string? DeviationNotes { get; set; }
    public DateTime InspectionDate { get; set; } = DateTime.UtcNow;
}

// ── SR0010: Property Issuing ─────────────────────────────────────────────────
public class StoreIssueVoucher : BaseDomainEntity
{
    public Guid ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }
    public string SivNumber { get; set; } = string.Empty;
    public string? FaivNumber { get; set; }
    public DocumentType VoucherType { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public Guid IssuedById { get; set; }
    public AppUser? IssuedBy { get; set; }
    public string? RecipientSignature { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Issued;
    public ICollection<StoreIssueVoucherDetail> Details { get; set; } = [];
}

public class StoreIssueVoucherDetail : BaseDomainEntity
{
    public Guid StoreIssueVoucherId { get; set; }
    public StoreIssueVoucher? StoreIssueVoucher { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int QuantityIssued { get; set; }
    public decimal? UnitCost { get; set; }
}

// ── SR0012: Property Return Management ───────────────────────────────────────
public class PropertyReturn : BaseDomainEntity
{
    public string RmrnNumber { get; set; } = string.Empty;
    public Guid ReturnedById { get; set; }
    public AppUser? ReturnedBy { get; set; }
    public Guid? ReceivedById { get; set; }
    public AppUser? ReceivedBy { get; set; }
    public Guid? AuthorizedById { get; set; }
    public AppUser? AuthorizedBy { get; set; }
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public string? Reason { get; set; }
    public ICollection<PropertyReturnDetail> Details { get; set; } = [];
}

public class PropertyReturnDetail : BaseDomainEntity
{
    public Guid PropertyReturnId { get; set; }
    public PropertyReturn? PropertyReturn { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public string? TagNumber { get; set; }
    public string? SerialNumber { get; set; }
    public PropertyCondition Condition { get; set; }
}

// ── FR0014: Property Transfer ────────────────────────────────────────────────
public class PropertyTransfer : BaseDomainEntity
{
    public string RmtnNumber { get; set; } = string.Empty;
    public Guid FromCustodianId { get; set; }
    public AppUser? FromCustodian { get; set; }
    public Guid ToCustodianId { get; set; }
    public AppUser? ToCustodian { get; set; }
    public Guid? AuthorizedById { get; set; }
    public AppUser? AuthorizedBy { get; set; }
    public DateTime TransferDate { get; set; } = DateTime.UtcNow;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public string? Reason { get; set; }
    public ICollection<PropertyTransferDetail> Details { get; set; } = [];
}

public class PropertyTransferDetail : BaseDomainEntity
{
    public Guid PropertyTransferId { get; set; }
    public PropertyTransfer? PropertyTransfer { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public int Quantity { get; set; }
    public string? TagNumber { get; set; }
    public string? SerialNumber { get; set; }
}

// ── FR0013: User Custody (UC) ────────────────────────────────────────────────
public class UserCustody : BaseDomainEntity
{
    public Guid CustodianId { get; set; }
    public AppUser? Custodian { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public int Quantity { get; set; }
    public string? TagNumber { get; set; }
    public string? SerialNumber { get; set; }
    public string SourceDocumentNumber { get; set; } = string.Empty;
}

// ── FR0017: Stock Disposal ───────────────────────────────────────────────────
public class DisposalRecord : BaseDomainEntity
{
    public string DisposalNumber { get; set; } = string.Empty;
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid? ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public Guid? CustodianId { get; set; }
    public AppUser? Custodian { get; set; }
    public int Quantity { get; set; }
    public PropertyCondition Condition { get; set; }
    public DisposalMethod DisposalMethod { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public Guid? ApprovedById { get; set; }
    public AppUser? ApprovedBy { get; set; }
    public string? Notes { get; set; }
}

// ── FR0020: Annual Inventory ─────────────────────────────────────────────────
public class AnnualInventory : BaseDomainEntity
{
    public string InventoryNumber { get; set; } = string.Empty;
    public int FiscalYear { get; set; }
    public string Location { get; set; } = string.Empty;
    public Guid CountedById { get; set; }
    public AppUser? CountedBy { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public DateTime CountDate { get; set; } = DateTime.UtcNow;
    public ICollection<AnnualInventoryLine> Lines { get; set; } = [];
}

public class AnnualInventoryLine : BaseDomainEntity
{
    public Guid AnnualInventoryId { get; set; }
    public AnnualInventory? AnnualInventory { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public Guid? ShelfId { get; set; }
    public ShelfLocation? Shelf { get; set; }
    public int ExpectedQuantity { get; set; }
    public int CountedQuantity { get; set; }
    public int Discrepancy { get; set; }
    public string? Notes { get; set; }
}

// ── FR0015: Property Handover Management ─────────────────────────────────────
public class PropertyHandover : BaseDomainEntity
{
    public string HandoverNumber { get; set; } = string.Empty;
    public Guid HandoverFromId { get; set; }
    public AppUser? HandoverFrom { get; set; }
    public Guid HandoverToId { get; set; }
    public AppUser? HandoverTo { get; set; }
    public Guid? AuthorizedById { get; set; }
    public AppUser? AuthorizedBy { get; set; }
    public DateTime HandoverDate { get; set; } = DateTime.UtcNow;
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public string? Purpose { get; set; }
    public string? FromLocation { get; set; }
    public string? ToLocation { get; set; }
    public string? Remarks { get; set; }
    public ICollection<PropertyHandoverDetail> Details { get; set; } = [];
}

public class PropertyHandoverDetail : BaseDomainEntity
{
    public Guid PropertyHandoverId { get; set; }
    public PropertyHandover? PropertyHandover { get; set; }
    public Guid ItemId { get; set; }
    public ItemMaster? Item { get; set; }
    public int Quantity { get; set; }
    public string? TagNumber { get; set; }
    public string? SerialNumber { get; set; }
    public string? FarnNumber { get; set; }
    public string? RmrnNumber { get; set; }
    public string? FaivNumber { get; set; }
}

// ── FR0016: Compliance Management ────────────────────────────────────────────
public class ComplianceRecord : BaseDomainEntity
{
    public string ComplianceNumber { get; set; } = string.Empty;
    public Guid? InventoryId { get; set; }
    public AnnualInventory? Inventory { get; set; }
    public Guid ReviewedById { get; set; }
    public AppUser? ReviewedBy { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Submitted;
    public string? Findings { get; set; }
    public string? Recommendations { get; set; }
    public string? CorrectiveActions { get; set; }
    public DateTime ReviewDate { get; set; } = DateTime.UtcNow;
}

// ── SR006: Budget Allocation for PR validation ───────────────────────────────
public class BudgetAllocation : BaseDomainEntity
{
    public int FiscalYear { get; set; }
    public string? Department { get; set; }
    public string? Division { get; set; }
    public decimal AllocatedAmount { get; set; }
    public decimal UtilizedAmount { get; set; }

    [NotMapped]
    public decimal RemainingAmount => AllocatedAmount - UtilizedAmount;
}

// ── FR0019: Report view models ───────────────────────────────────────────────
public class StockSummaryReport
{
    public Guid ItemId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string UnitOfMeasure { get; set; } = string.Empty;
    public int CurrentQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int MinStockLevel { get; set; }
}

public class PropertyMovementReport
{
    public Guid LedgerId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public int QuantityChange { get; set; }
    public DateTime TransactionDate { get; set; }
}
