using PMS.Application.DTO;
using PMS.Domain.Entities;
using PMS.Domain.Enums;

namespace PMS.Application.Contracts.Services;

public interface IPasWorkflowService
{
    // Stock operations (SR007)
    Task<InventoryStock> RegisterOpeningBalance(RegisterOpeningBalanceRequest request, CancellationToken cancellationToken = default);
    Task<InventoryStock> AdjustStock(StockAdjustmentRequest request, CancellationToken cancellationToken = default);

    // Store request workflow (SR005)
    Task<ServiceRequest> CreateStoreRequest(CreateStoreRequestRequest request, CancellationToken cancellationToken = default);
    Task<ServiceRequest> ApproveStoreRequest(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<ServiceRequest> RejectStoreRequest(Guid id, RejectRequest request, CancellationToken cancellationToken = default);

    // Purchase request workflow (SR006)
    Task<PurchaseRequest> CreatePurchaseRequest(CreatePurchaseRequestRequest request, CancellationToken cancellationToken = default);
    Task<PurchaseRequest> ApprovePurchaseRequest(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<PurchaseRequest> RejectPurchaseRequest(Guid id, RejectRequest request, CancellationToken cancellationToken = default);

    // Receiving workflow (SR009)
    Task<ReceivingNote> CreateReceivingNote(CreateReceivingNoteRequest request, CancellationToken cancellationToken = default);
    Task<InspectionLog> RecordInspection(RecordInspectionRequest request, CancellationToken cancellationToken = default);
    Task<ReceivingNote> ReleaseReceivingToStock(ReleaseReceivingRequest request, CancellationToken cancellationToken = default);

    // Issuing workflow (SR0010)
    Task<StoreIssueVoucher> IssueApprovedRequest(IssueStockRequest request, CancellationToken cancellationToken = default);

    // Return workflow (SR0012)
    Task<PropertyReturn> CreateReturn(CreateReturnRequest request, CancellationToken cancellationToken = default);
    Task<PropertyReturn> ApproveReturn(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Transfer workflow (FR0014)
    Task<PropertyTransfer> CreateTransfer(CreateTransferRequest request, CancellationToken cancellationToken = default);
    Task<PropertyTransfer> ApproveTransfer(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Handover workflow (FR0015)
    Task<PropertyHandover> CreateHandover(CreateHandoverRequest request, CancellationToken cancellationToken = default);
    Task<PropertyHandover> ApproveHandover(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Disposal workflow (FR0017)
    Task<DisposalRecord> CreateDisposal(CreateDisposalRequest request, CancellationToken cancellationToken = default);
    Task<DisposalRecord> ApproveDisposal(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Compliance (FR0016)
    Task<ComplianceRecord> CreateComplianceRecord(CreateComplianceRecordRequest request, CancellationToken cancellationToken = default);
    Task<ComplianceRecord> CloseComplianceRecord(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Annual inventory (FR0020)
    Task<AnnualInventory> CreateAnnualInventory(CreateAnnualInventoryRequest request, CancellationToken cancellationToken = default);
    Task<AnnualInventory> CompleteAnnualInventory(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);

    // Tag number generation (SR008/SR009)
    Task<string> GenerateTagNumber(Guid warehouseId, PropertyType propertyType, CancellationToken cancellationToken = default);
}
