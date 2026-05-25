using MediatR;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Domain.Entities;

namespace PMS.Application.CQRS;

// ── Command definitions ──────────────────────────────────────────────────────

public record RegisterOpeningBalanceCommand(RegisterOpeningBalanceRequest Request) : IRequest<InventoryStock>;
public record AdjustStockCommand(StockAdjustmentRequest Request) : IRequest<InventoryStock>;
public record CreateStoreRequestCommand(CreateStoreRequestRequest Request) : IRequest<ServiceRequest>;
public record ApproveStoreRequestCommand(Guid Id, ApproveRequest Request) : IRequest<ServiceRequest>;
public record RejectStoreRequestCommand(Guid Id, RejectRequest Request) : IRequest<ServiceRequest>;
public record CreatePurchaseRequestCommand(CreatePurchaseRequestRequest Request) : IRequest<PurchaseRequest>;
public record ApprovePurchaseRequestCommand(Guid Id, ApproveRequest Request) : IRequest<PurchaseRequest>;
public record RejectPurchaseRequestCommand(Guid Id, RejectRequest Request) : IRequest<PurchaseRequest>;
public record CreateReceivingNoteCommand(CreateReceivingNoteRequest Request) : IRequest<ReceivingNote>;
public record RecordInspectionCommand(RecordInspectionRequest Request) : IRequest<InspectionLog>;
public record ReleaseReceivingCommand(ReleaseReceivingRequest Request) : IRequest<ReceivingNote>;
public record IssueStockCommand(IssueStockRequest Request) : IRequest<StoreIssueVoucher>;
public record CreateReturnCommand(CreateReturnRequest Request) : IRequest<PropertyReturn>;
public record ApproveReturnCommand(Guid Id, ApproveRequest Request) : IRequest<PropertyReturn>;
public record CreateTransferCommand(CreateTransferRequest Request) : IRequest<PropertyTransfer>;
public record ApproveTransferCommand(Guid Id, ApproveRequest Request) : IRequest<PropertyTransfer>;
public record CreateHandoverCommand(CreateHandoverRequest Request) : IRequest<PropertyHandover>;
public record ApproveHandoverCommand(Guid Id, ApproveRequest Request) : IRequest<PropertyHandover>;
public record CreateDisposalCommand(CreateDisposalRequest Request) : IRequest<DisposalRecord>;
public record ApproveDisposalCommand(Guid Id, ApproveRequest Request) : IRequest<DisposalRecord>;
public record CreateComplianceCommand(CreateComplianceRecordRequest Request) : IRequest<ComplianceRecord>;
public record CloseComplianceCommand(Guid Id, ApproveRequest Request) : IRequest<ComplianceRecord>;
public record CreateAnnualInventoryCommand(CreateAnnualInventoryRequest Request) : IRequest<AnnualInventory>;
public record CompleteAnnualInventoryCommand(Guid Id, ApproveRequest Request) : IRequest<AnnualInventory>;

// ── Handler ──────────────────────────────────────────────────────────────────

public class PasWorkflowCommandHandler(IPasWorkflowService workflowService) :
    IRequestHandler<RegisterOpeningBalanceCommand, InventoryStock>,
    IRequestHandler<AdjustStockCommand, InventoryStock>,
    IRequestHandler<CreateStoreRequestCommand, ServiceRequest>,
    IRequestHandler<ApproveStoreRequestCommand, ServiceRequest>,
    IRequestHandler<RejectStoreRequestCommand, ServiceRequest>,
    IRequestHandler<CreatePurchaseRequestCommand, PurchaseRequest>,
    IRequestHandler<ApprovePurchaseRequestCommand, PurchaseRequest>,
    IRequestHandler<RejectPurchaseRequestCommand, PurchaseRequest>,
    IRequestHandler<CreateReceivingNoteCommand, ReceivingNote>,
    IRequestHandler<RecordInspectionCommand, InspectionLog>,
    IRequestHandler<ReleaseReceivingCommand, ReceivingNote>,
    IRequestHandler<IssueStockCommand, StoreIssueVoucher>,
    IRequestHandler<CreateReturnCommand, PropertyReturn>,
    IRequestHandler<ApproveReturnCommand, PropertyReturn>,
    IRequestHandler<CreateTransferCommand, PropertyTransfer>,
    IRequestHandler<ApproveTransferCommand, PropertyTransfer>,
    IRequestHandler<CreateHandoverCommand, PropertyHandover>,
    IRequestHandler<ApproveHandoverCommand, PropertyHandover>,
    IRequestHandler<CreateDisposalCommand, DisposalRecord>,
    IRequestHandler<ApproveDisposalCommand, DisposalRecord>,
    IRequestHandler<CreateComplianceCommand, ComplianceRecord>,
    IRequestHandler<CloseComplianceCommand, ComplianceRecord>,
    IRequestHandler<CreateAnnualInventoryCommand, AnnualInventory>,
    IRequestHandler<CompleteAnnualInventoryCommand, AnnualInventory>
{
    public Task<InventoryStock> Handle(RegisterOpeningBalanceCommand command, CancellationToken cancellationToken)
        => workflowService.RegisterOpeningBalance(command.Request, cancellationToken);

    public Task<InventoryStock> Handle(AdjustStockCommand command, CancellationToken cancellationToken)
        => workflowService.AdjustStock(command.Request, cancellationToken);

    public Task<ServiceRequest> Handle(CreateStoreRequestCommand command, CancellationToken cancellationToken)
        => workflowService.CreateStoreRequest(command.Request, cancellationToken);

    public Task<ServiceRequest> Handle(ApproveStoreRequestCommand command, CancellationToken cancellationToken)
        => workflowService.ApproveStoreRequest(command.Id, command.Request, cancellationToken);

    public Task<ServiceRequest> Handle(RejectStoreRequestCommand command, CancellationToken cancellationToken)
        => workflowService.RejectStoreRequest(command.Id, command.Request, cancellationToken);

    public Task<PurchaseRequest> Handle(CreatePurchaseRequestCommand command, CancellationToken cancellationToken)
        => workflowService.CreatePurchaseRequest(command.Request, cancellationToken);

    public Task<PurchaseRequest> Handle(ApprovePurchaseRequestCommand command, CancellationToken cancellationToken)
        => workflowService.ApprovePurchaseRequest(command.Id, command.Request, cancellationToken);

    public Task<PurchaseRequest> Handle(RejectPurchaseRequestCommand command, CancellationToken cancellationToken)
        => workflowService.RejectPurchaseRequest(command.Id, command.Request, cancellationToken);

    public Task<ReceivingNote> Handle(CreateReceivingNoteCommand command, CancellationToken cancellationToken)
        => workflowService.CreateReceivingNote(command.Request, cancellationToken);

    public Task<InspectionLog> Handle(RecordInspectionCommand command, CancellationToken cancellationToken)
        => workflowService.RecordInspection(command.Request, cancellationToken);

    public Task<ReceivingNote> Handle(ReleaseReceivingCommand command, CancellationToken cancellationToken)
        => workflowService.ReleaseReceivingToStock(command.Request, cancellationToken);

    public Task<StoreIssueVoucher> Handle(IssueStockCommand command, CancellationToken cancellationToken)
        => workflowService.IssueApprovedRequest(command.Request, cancellationToken);

    public Task<PropertyReturn> Handle(CreateReturnCommand command, CancellationToken cancellationToken)
        => workflowService.CreateReturn(command.Request, cancellationToken);

    public Task<PropertyReturn> Handle(ApproveReturnCommand command, CancellationToken cancellationToken)
        => workflowService.ApproveReturn(command.Id, command.Request, cancellationToken);

    public Task<PropertyTransfer> Handle(CreateTransferCommand command, CancellationToken cancellationToken)
        => workflowService.CreateTransfer(command.Request, cancellationToken);

    public Task<PropertyTransfer> Handle(ApproveTransferCommand command, CancellationToken cancellationToken)
        => workflowService.ApproveTransfer(command.Id, command.Request, cancellationToken);

    public Task<PropertyHandover> Handle(CreateHandoverCommand command, CancellationToken cancellationToken)
        => workflowService.CreateHandover(command.Request, cancellationToken);

    public Task<PropertyHandover> Handle(ApproveHandoverCommand command, CancellationToken cancellationToken)
        => workflowService.ApproveHandover(command.Id, command.Request, cancellationToken);

    public Task<DisposalRecord> Handle(CreateDisposalCommand command, CancellationToken cancellationToken)
        => workflowService.CreateDisposal(command.Request, cancellationToken);

    public Task<DisposalRecord> Handle(ApproveDisposalCommand command, CancellationToken cancellationToken)
        => workflowService.ApproveDisposal(command.Id, command.Request, cancellationToken);

    public Task<ComplianceRecord> Handle(CreateComplianceCommand command, CancellationToken cancellationToken)
        => workflowService.CreateComplianceRecord(command.Request, cancellationToken);

    public Task<ComplianceRecord> Handle(CloseComplianceCommand command, CancellationToken cancellationToken)
        => workflowService.CloseComplianceRecord(command.Id, command.Request, cancellationToken);

    public Task<AnnualInventory> Handle(CreateAnnualInventoryCommand command, CancellationToken cancellationToken)
        => workflowService.CreateAnnualInventory(command.Request, cancellationToken);

    public Task<AnnualInventory> Handle(CompleteAnnualInventoryCommand command, CancellationToken cancellationToken)
        => workflowService.CompleteAnnualInventory(command.Id, command.Request, cancellationToken);
}
