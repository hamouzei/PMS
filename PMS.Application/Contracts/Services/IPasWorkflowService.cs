using PMS.Application.DTO;
using PMS.Domain.Entities;

namespace PMS.Application.Contracts.Services;

public interface IPasWorkflowService
{
    Task<InventoryStock> RegisterOpeningBalance(RegisterOpeningBalanceRequest request, CancellationToken cancellationToken = default);
    Task<InventoryStock> AdjustStock(StockAdjustmentRequest request, CancellationToken cancellationToken = default);
    Task<ServiceRequest> CreateStoreRequest(CreateStoreRequestRequest request, CancellationToken cancellationToken = default);
    Task<ServiceRequest> ApproveStoreRequest(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<ServiceRequest> RejectStoreRequest(Guid id, RejectRequest request, CancellationToken cancellationToken = default);
    Task<PurchaseRequest> CreatePurchaseRequest(CreatePurchaseRequestRequest request, CancellationToken cancellationToken = default);
    Task<PurchaseRequest> ApprovePurchaseRequest(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<ReceivingNote> CreateReceivingNote(CreateReceivingNoteRequest request, CancellationToken cancellationToken = default);
    Task<InspectionLog> RecordInspection(RecordInspectionRequest request, CancellationToken cancellationToken = default);
    Task<ReceivingNote> ReleaseReceivingToStock(ReleaseReceivingRequest request, CancellationToken cancellationToken = default);
    Task<StoreIssueVoucher> IssueApprovedRequest(IssueStockRequest request, CancellationToken cancellationToken = default);
    Task<PropertyReturn> CreateReturn(CreateReturnRequest request, CancellationToken cancellationToken = default);
    Task<PropertyReturn> ApproveReturn(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<PropertyTransfer> CreateTransfer(CreateTransferRequest request, CancellationToken cancellationToken = default);
    Task<PropertyTransfer> ApproveTransfer(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<DisposalRecord> CreateDisposal(CreateDisposalRequest request, CancellationToken cancellationToken = default);
    Task<DisposalRecord> ApproveDisposal(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
    Task<AnnualInventory> CreateAnnualInventory(CreateAnnualInventoryRequest request, CancellationToken cancellationToken = default);
    Task<AnnualInventory> CompleteAnnualInventory(Guid id, ApproveRequest request, CancellationToken cancellationToken = default);
}
