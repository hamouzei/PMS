using Microsoft.EntityFrameworkCore;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Application.Exceptions;
using PMS.Domain.Entities;
using PMS.Domain.Enums;

namespace PMS.Persistence.Services;

public class PasWorkflowService(PMSDbContext context) : IPasWorkflowService
{
    public async Task<InventoryStock> RegisterOpeningBalance(
        RegisterOpeningBalanceRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Quantity < 0)
        {
            throw new BusinessRuleException("Opening balance cannot be negative.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var stock = await GetOrCreateStock(request.ItemId, request.ShelfId, cancellationToken);
        stock.CurrentQuantity += request.Quantity;
        stock.BookBalance += request.Quantity;
        stock.PhysicalBalance += request.Quantity;
        SynchronizeStock(stock);

        context.StockLedgers.Add(CreateLedger(
            request.ItemId,
            request.ShelfId,
            request.Quantity,
            stock.CurrentQuantity,
            StockTransactionType.OpeningBalance,
            DocumentType.AnnualInventory,
            null,
            "OPENING",
            request.UnitCost,
            request.Reason));

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return stock;
    }

    public async Task<InventoryStock> AdjustStock(
        StockAdjustmentRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var stock = await GetStock(request.ItemId, request.ShelfId, cancellationToken);
        var nextQuantity = stock.CurrentQuantity + request.QuantityChange;

        if (nextQuantity < stock.ReservedQuantity)
        {
            throw new BusinessRuleException("Stock adjustment cannot reduce current quantity below reserved quantity.");
        }

        stock.CurrentQuantity = nextQuantity;
        stock.BookBalance += request.QuantityChange;
        SynchronizeStock(stock);

        context.StockLedgers.Add(CreateLedger(
            request.ItemId,
            request.ShelfId,
            request.QuantityChange,
            stock.CurrentQuantity,
            StockTransactionType.Adjustment,
            null,
            null,
            "ADJUSTMENT",
            null,
            request.Reason));

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return stock;
    }

    public async Task<ServiceRequest> CreateStoreRequest(
        CreateStoreRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Details.Count == 0)
        {
            throw new BusinessRuleException("Store request requires at least one item.");
        }

        var serviceRequest = new ServiceRequest
        {
            SrNumber = await NextNumber(DocumentType.SR, cancellationToken),
            RequesterId = request.RequesterId,
            RequestType = request.RequestType,
            Reason = request.Reason,
            Status = WorkflowStatus.PendingApproval,
            Details = request.Details.Select(line => new ServiceRequestDetail
            {
                ItemId = line.ItemId,
                ShelfId = line.ShelfId,
                RequestedQty = line.Quantity,
                UnitCost = line.UnitCost,
                Remarks = line.Remarks
            }).ToList()
        };

        context.ServiceRequests.Add(serviceRequest);
        AddNotification(request.RequesterId, "Store request submitted", $"Store request {serviceRequest.SrNumber} is pending approval.", serviceRequest.Id, serviceRequest.SrNumber);
        AddAudit(request.RequesterId, "Submitted", nameof(ServiceRequest), serviceRequest.Id, serviceRequest.SrNumber);
        await context.SaveChangesAsync(cancellationToken);
        return serviceRequest;
    }

    public async Task<ServiceRequest> ApproveStoreRequest(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var serviceRequest = await context.ServiceRequests
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Store request was not found.");

        if (serviceRequest.Status is not WorkflowStatus.PendingApproval and not WorkflowStatus.Submitted)
        {
            throw new BusinessRuleException("Only submitted or pending store requests can be approved.");
        }
        EnsureTransition(serviceRequest.Status, WorkflowStatus.Approved, serviceRequest.SrNumber);

        foreach (var detail in serviceRequest.Details)
        {
            var quantityToReserve = detail.ApprovedQty > 0 ? detail.ApprovedQty : detail.RequestedQty;
            var stock = detail.ShelfId.HasValue
                ? await GetStock(detail.ItemId, detail.ShelfId.Value, cancellationToken)
                : await FindStockForIssue(detail.ItemId, quantityToReserve, cancellationToken);

            if (stock.AvailableQuantity < quantityToReserve)
            {
                throw new BusinessRuleException($"Insufficient stock for item {detail.Item?.ItemName ?? detail.ItemId.ToString()}.");
            }

            detail.ApprovedQty = quantityToReserve;
            detail.ShelfId = stock.ShelfId;
            stock.ReservedQuantity += quantityToReserve;
            SynchronizeStock(stock);

            context.StockLedgers.Add(CreateLedger(
                detail.ItemId,
                stock.ShelfId,
                0,
                stock.CurrentQuantity,
                StockTransactionType.Reservation,
                DocumentType.SR,
                serviceRequest.Id,
                serviceRequest.SrNumber,
                detail.UnitCost,
                request.Remark));
        }

        serviceRequest.ApprovedById = request.ActorId;
        serviceRequest.Status = WorkflowStatus.Approved;
        serviceRequest.SupervisorRemark = request.Remark;
        AddNotification(serviceRequest.RequesterId, "Store request approved", $"Store request {serviceRequest.SrNumber} was approved.", serviceRequest.Id, serviceRequest.SrNumber);
        AddAudit(request.ActorId, "Approved", nameof(ServiceRequest), serviceRequest.Id, serviceRequest.SrNumber);

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return serviceRequest;
    }

    public async Task<ServiceRequest> RejectStoreRequest(
        Guid id,
        RejectRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceRequest = await context.ServiceRequests.SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Store request was not found.");

        EnsureTransition(serviceRequest.Status, WorkflowStatus.Rejected, serviceRequest.SrNumber);
        serviceRequest.ApprovedById = request.ActorId;
        serviceRequest.Status = WorkflowStatus.Rejected;
        serviceRequest.SupervisorRemark = request.Reason;
        AddNotification(serviceRequest.RequesterId, "Store request rejected", request.Reason, serviceRequest.Id, serviceRequest.SrNumber);
        AddAudit(request.ActorId, "Rejected", nameof(ServiceRequest), serviceRequest.Id, request.Reason);
        await context.SaveChangesAsync(cancellationToken);
        return serviceRequest;
    }

    public async Task<PurchaseRequest> CreatePurchaseRequest(
        CreatePurchaseRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var purchaseRequest = new PurchaseRequest
        {
            PrNumber = await NextNumber(DocumentType.PR, cancellationToken),
            RequesterId = request.RequesterId,
            RequestType = request.RequestType,
            Justification = request.Justification,
            EstimatedBudget = request.EstimatedBudget,
            Status = WorkflowStatus.PendingApproval,
            Details = request.Details.Select(line => new PurchaseRequestDetail
            {
                ItemId = line.ItemId == Guid.Empty ? null : line.ItemId,
                ItemDescription = line.Remarks ?? "Requested item",
                UnitOfMeasure = "Unit",
                Quantity = line.Quantity,
                UnitCost = line.UnitCost
            }).ToList()
        };

        context.PurchaseRequests.Add(purchaseRequest);
        AddNotification(request.RequesterId, "Purchase request submitted", $"Purchase request {purchaseRequest.PrNumber} is pending approval.", purchaseRequest.Id, purchaseRequest.PrNumber);
        AddAudit(request.RequesterId, "Submitted", nameof(PurchaseRequest), purchaseRequest.Id, purchaseRequest.PrNumber);
        await context.SaveChangesAsync(cancellationToken);
        return purchaseRequest;
    }

    public async Task<PurchaseRequest> ApprovePurchaseRequest(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        var purchaseRequest = await context.PurchaseRequests.SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Purchase request was not found.");

        EnsureTransition(purchaseRequest.Status, WorkflowStatus.Approved, purchaseRequest.PrNumber);
        purchaseRequest.ApprovedById = request.ActorId;
        purchaseRequest.Status = WorkflowStatus.Approved;
        AddNotification(purchaseRequest.RequesterId, "Purchase request approved", $"Purchase request {purchaseRequest.PrNumber} was approved.", purchaseRequest.Id, purchaseRequest.PrNumber);
        AddAudit(request.ActorId, "Approved", nameof(PurchaseRequest), purchaseRequest.Id, request.Remark);
        await context.SaveChangesAsync(cancellationToken);
        return purchaseRequest;
    }

    public async Task<ReceivingNote> CreateReceivingNote(
        CreateReceivingNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Details.Count == 0)
        {
            throw new BusinessRuleException("Receiving note requires at least one item.");
        }

        var itemIds = request.Details.Select(line => line.ItemId).Distinct().ToArray();
        var items = await context.ItemMasters
            .Where(item => itemIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, cancellationToken);

        var hasFixedAsset = items.Values.Any(item => item.PropertyType == PropertyType.FixedAsset);
        var requiresInspection = items.Values.Any(item => item.RequiresInspection);
        var receivingNote = new ReceivingNote
        {
            GrnNumber = await NextNumber(DocumentType.GRN, cancellationToken),
            FarnNumber = hasFixedAsset ? await NextNumber(DocumentType.FARN, cancellationToken) : null,
            SupplierId = request.SupplierId,
            WarehouseId = request.WarehouseId,
            ReceivedById = request.ReceivedById,
            PurchaseRequestId = request.PurchaseRequestId,
            InvoiceNumber = request.InvoiceNumber,
            PurchaseOrderNumber = request.PurchaseOrderNumber,
            StoreRequestNumber = request.StoreRequestNumber,
            TenderReferenceNumber = request.TenderReferenceNumber,
            Notes = request.Notes,
            Status = requiresInspection ? WorkflowStatus.InspectionPending : WorkflowStatus.Received,
            Details = request.Details.Select(line => new ReceivingNoteDetail
            {
                ItemId = line.ItemId,
                ShelfId = line.ShelfId,
                QuantityReceived = line.Quantity,
                UnitCost = line.UnitCost ?? items[line.ItemId].UnitCost,
                TagNumber = line.TagNumber,
                SerialNumber = line.SerialNumber
            }).ToList()
        };

        context.ReceivingNotes.Add(receivingNote);
        AddAttachments(DocumentType.GRN, receivingNote.Id, request.Attachments);
        AddNotification(null, UserRole.Inspector, "Receiving note created", $"Receiving note {receivingNote.GrnNumber} is ready for inspection/release.", receivingNote.Id, receivingNote.GrnNumber);
        AddAudit(request.ReceivedById, "Created", nameof(ReceivingNote), receivingNote.Id, receivingNote.GrnNumber);
        await context.SaveChangesAsync(cancellationToken);
        return receivingNote;
    }

    public async Task<InspectionLog> RecordInspection(
        RecordInspectionRequest request,
        CancellationToken cancellationToken = default)
    {
        var receivingNote = await context.ReceivingNotes
            .Include(value => value.InspectionLog)
            .SingleOrDefaultAsync(value => value.Id == request.ReceivingNoteId, cancellationToken)
            ?? throw new BusinessRuleException("Receiving note was not found.");

        var inspection = receivingNote.InspectionLog;
        if (inspection is null)
        {
            inspection = new InspectionLog
            {
                ReceivingNoteId = request.ReceivingNoteId,
                InspectorId = request.InspectorId
            };
            context.InspectionLogs.Add(inspection);
        }

        inspection.IsPassed = request.IsPassed;
        inspection.DeviationNotes = request.DeviationNotes;
        inspection.InspectionDate = DateTime.UtcNow;
        var nextStatus = request.IsPassed ? WorkflowStatus.InspectionPassed : WorkflowStatus.InspectionFailed;
        EnsureTransition(receivingNote.Status, nextStatus, receivingNote.GrnNumber);
        receivingNote.Status = nextStatus;

        AddAttachments(DocumentType.FARN, receivingNote.Id, request.Attachments);
        AddNotification(receivingNote.ReceivedById, "Inspection recorded", $"Inspection for {receivingNote.GrnNumber} was {(request.IsPassed ? "passed" : "failed")}.", receivingNote.Id, receivingNote.GrnNumber);
        AddAudit(request.InspectorId, "Inspected", nameof(ReceivingNote), receivingNote.Id, request.DeviationNotes);
        await context.SaveChangesAsync(cancellationToken);
        return inspection;
    }

    public async Task<ReceivingNote> ReleaseReceivingToStock(
        ReleaseReceivingRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var receivingNote = await context.ReceivingNotes
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .Include(value => value.InspectionLog)
            .SingleOrDefaultAsync(value => value.Id == request.ReceivingNoteId, cancellationToken)
            ?? throw new BusinessRuleException("Receiving note was not found.");

        if (receivingNote.Status == WorkflowStatus.Closed)
        {
            throw new BusinessRuleException("Receiving note has already been released to stock.");
        }
        EnsureTransition(receivingNote.Status, WorkflowStatus.Closed, receivingNote.GrnNumber);

        var requiresInspection = receivingNote.Details.Any(detail => detail.Item?.RequiresInspection == true);
        if (requiresInspection && receivingNote.Status != WorkflowStatus.InspectionPassed)
        {
            throw new BusinessRuleException("Receiving note must pass inspection before stock release.");
        }

        foreach (var detail in receivingNote.Details)
        {
            if (!detail.ShelfId.HasValue)
            {
                throw new BusinessRuleException("Every receiving detail must have a shelf before release.");
            }

            var stock = await GetOrCreateStock(detail.ItemId, detail.ShelfId.Value, cancellationToken);
            stock.CurrentQuantity += detail.QuantityReceived;
            stock.BookBalance += detail.QuantityReceived;
            stock.PhysicalBalance += detail.QuantityReceived;
            SynchronizeStock(stock);

            var documentType = detail.Item?.PropertyType == PropertyType.FixedAsset ? DocumentType.FARN : DocumentType.GRN;
            context.StockLedgers.Add(CreateLedger(
                detail.ItemId,
                detail.ShelfId.Value,
                detail.QuantityReceived,
                stock.CurrentQuantity,
                requiresInspection ? StockTransactionType.InspectionRelease : StockTransactionType.Receipt,
                documentType,
                receivingNote.Id,
                documentType == DocumentType.FARN ? receivingNote.FarnNumber : receivingNote.GrnNumber,
                detail.UnitCost,
                "Receiving release"));
        }

        receivingNote.ApprovedById = request.ReleasedById;
        receivingNote.Status = WorkflowStatus.Closed;
        AddAudit(request.ReleasedById, "ReleasedToStock", nameof(ReceivingNote), receivingNote.Id, receivingNote.GrnNumber);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return receivingNote;
    }

    public async Task<StoreIssueVoucher> IssueApprovedRequest(
        IssueStockRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var serviceRequest = await context.ServiceRequests
            .Include(value => value.Requester)
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .SingleOrDefaultAsync(value => value.Id == request.ServiceRequestId, cancellationToken)
            ?? throw new BusinessRuleException("Store request was not found.");

        if (serviceRequest.Status != WorkflowStatus.Approved)
        {
            throw new BusinessRuleException("Only approved store requests can be issued.");
        }
        EnsureTransition(serviceRequest.Status, WorkflowStatus.Issued, serviceRequest.SrNumber);

        var hasFixedAsset = serviceRequest.Details.Any(detail => detail.Item?.PropertyType == PropertyType.FixedAsset);
        var voucher = new StoreIssueVoucher
        {
            ServiceRequestId = serviceRequest.Id,
            SivNumber = await NextNumber(DocumentType.SIV, cancellationToken),
            FaivNumber = hasFixedAsset ? await NextNumber(DocumentType.FAIV, cancellationToken) : null,
            VoucherType = hasFixedAsset ? DocumentType.FAIV : DocumentType.SIV,
            IssuedById = request.IssuedById,
            RecipientSignature = request.RecipientSignature
        };

        foreach (var detail in serviceRequest.Details)
        {
            var quantityToIssue = (detail.ApprovedQty > 0 ? detail.ApprovedQty : detail.RequestedQty) - detail.IssuedQty;
            if (quantityToIssue <= 0)
            {
                continue;
            }

            var stock = detail.ShelfId.HasValue
                ? await GetStock(detail.ItemId, detail.ShelfId.Value, cancellationToken)
                : await FindStockForIssue(detail.ItemId, quantityToIssue, cancellationToken);

            if (stock.CurrentQuantity < quantityToIssue || stock.ReservedQuantity < quantityToIssue)
            {
                throw new BusinessRuleException("Approved stock is no longer available for issue.");
            }

            stock.CurrentQuantity -= quantityToIssue;
            stock.ReservedQuantity -= quantityToIssue;
            stock.BookBalance -= quantityToIssue;
            stock.PhysicalBalance -= quantityToIssue;
            SynchronizeStock(stock);
            detail.IssuedQty += quantityToIssue;

            voucher.Details.Add(new StoreIssueVoucherDetail
            {
                ItemId = detail.ItemId,
                ShelfId = stock.ShelfId,
                QuantityIssued = quantityToIssue,
                UnitCost = detail.UnitCost ?? detail.Item?.UnitCost
            });

            if (detail.Item?.PropertyType == PropertyType.FixedAsset)
            {
                await AddCustody(serviceRequest.RequesterId, detail.ItemId, quantityToIssue, voucher.FaivNumber ?? voucher.SivNumber, null, null, cancellationToken);
            }

            context.StockLedgers.Add(CreateLedger(
                detail.ItemId,
                stock.ShelfId,
                -quantityToIssue,
                stock.CurrentQuantity,
                StockTransactionType.Issue,
                voucher.VoucherType,
                voucher.Id,
                voucher.FaivNumber ?? voucher.SivNumber,
                detail.UnitCost ?? detail.Item?.UnitCost,
                "Issued from approved store request"));
        }

        serviceRequest.Status = WorkflowStatus.Issued;
        context.StoreIssueVouchers.Add(voucher);
        AddNotification(serviceRequest.RequesterId, "Property issued", $"Store request {serviceRequest.SrNumber} was issued.", voucher.Id, voucher.FaivNumber ?? voucher.SivNumber);
        AddAudit(request.IssuedById, "Issued", nameof(StoreIssueVoucher), voucher.Id, voucher.FaivNumber ?? voucher.SivNumber);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return voucher;
    }

    public async Task<PropertyReturn> CreateReturn(
        CreateReturnRequest request,
        CancellationToken cancellationToken = default)
    {
        var propertyReturn = new PropertyReturn
        {
            RmrnNumber = await NextNumber(DocumentType.RMRN, cancellationToken),
            ReturnedById = request.ReturnedById,
            Reason = request.Reason,
            Details = request.Details.Select(line => new PropertyReturnDetail
            {
                ItemId = line.ItemId,
                ShelfId = line.ShelfId,
                Quantity = line.Quantity,
                UnitCost = line.UnitCost,
                TagNumber = line.TagNumber,
                SerialNumber = line.SerialNumber,
                Condition = line.Condition
            }).ToList()
        };

        context.PropertyReturns.Add(propertyReturn);
        AddAttachments(DocumentType.RMRN, propertyReturn.Id, request.Attachments);
        AddNotification(null, UserRole.Storekeeper, "Property return submitted", $"Return {propertyReturn.RmrnNumber} is pending receipt.", propertyReturn.Id, propertyReturn.RmrnNumber);
        AddAudit(request.ReturnedById, "Submitted", nameof(PropertyReturn), propertyReturn.Id, propertyReturn.RmrnNumber);
        await context.SaveChangesAsync(cancellationToken);
        return propertyReturn;
    }

    public async Task<PropertyReturn> ApproveReturn(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var propertyReturn = await context.PropertyReturns
            .Include(value => value.Details)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Property return was not found.");

        EnsureTransition(propertyReturn.Status, WorkflowStatus.Returned, propertyReturn.RmrnNumber);
        foreach (var detail in propertyReturn.Details)
        {
            var stock = await GetOrCreateStock(detail.ItemId, detail.ShelfId, cancellationToken);
            stock.CurrentQuantity += detail.Quantity;
            stock.BookBalance += detail.Quantity;
            stock.PhysicalBalance += detail.Quantity;
            SynchronizeStock(stock);

            await ReduceCustody(propertyReturn.ReturnedById, detail.ItemId, detail.Quantity, cancellationToken);

            context.StockLedgers.Add(CreateLedger(
                detail.ItemId,
                detail.ShelfId,
                detail.Quantity,
                stock.CurrentQuantity,
                StockTransactionType.Return,
                DocumentType.RMRN,
                propertyReturn.Id,
                propertyReturn.RmrnNumber,
                detail.UnitCost,
                propertyReturn.Reason));
        }

        propertyReturn.ReceivedById = request.ActorId;
        propertyReturn.AuthorizedById ??= request.ActorId;
        propertyReturn.Status = WorkflowStatus.Returned;
        AddAudit(request.ActorId, "ApprovedReturn", nameof(PropertyReturn), propertyReturn.Id, propertyReturn.RmrnNumber);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return propertyReturn;
    }

    public async Task<PropertyTransfer> CreateTransfer(
        CreateTransferRequest request,
        CancellationToken cancellationToken = default)
    {
        var transfer = new PropertyTransfer
        {
            RmtnNumber = await NextNumber(DocumentType.RMTN, cancellationToken),
            FromCustodianId = request.FromCustodianId,
            ToCustodianId = request.ToCustodianId,
            Reason = request.Reason,
            Details = request.Details.Select(line => new PropertyTransferDetail
            {
                ItemId = line.ItemId,
                Quantity = line.Quantity,
                TagNumber = line.TagNumber,
                SerialNumber = line.SerialNumber
            }).ToList()
        };

        context.PropertyTransfers.Add(transfer);
        AddAttachments(DocumentType.RMTN, transfer.Id, request.Attachments);
        AddNotification(request.ToCustodianId, "Property transfer submitted", $"Transfer {transfer.RmtnNumber} is pending approval.", transfer.Id, transfer.RmtnNumber);
        AddAudit(request.FromCustodianId, "Submitted", nameof(PropertyTransfer), transfer.Id, transfer.RmtnNumber);
        await context.SaveChangesAsync(cancellationToken);
        return transfer;
    }

    public async Task<PropertyTransfer> ApproveTransfer(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var transfer = await context.PropertyTransfers
            .Include(value => value.Details)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Property transfer was not found.");

        EnsureTransition(transfer.Status, WorkflowStatus.Transferred, transfer.RmtnNumber);
        foreach (var detail in transfer.Details)
        {
            await ReduceCustody(transfer.FromCustodianId, detail.ItemId, detail.Quantity, cancellationToken);
            await AddCustody(transfer.ToCustodianId, detail.ItemId, detail.Quantity, transfer.RmtnNumber, detail.TagNumber, detail.SerialNumber, cancellationToken);
        }

        transfer.AuthorizedById = request.ActorId;
        transfer.Status = WorkflowStatus.Transferred;
        AddNotification(transfer.ToCustodianId, "Property transfer approved", $"Transfer {transfer.RmtnNumber} was approved.", transfer.Id, transfer.RmtnNumber);
        AddAudit(request.ActorId, "ApprovedTransfer", nameof(PropertyTransfer), transfer.Id, transfer.RmtnNumber);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return transfer;
    }

    public async Task<DisposalRecord> CreateDisposal(
        CreateDisposalRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!request.ShelfId.HasValue && !request.CustodianId.HasValue)
        {
            throw new BusinessRuleException("Disposal requires either shelf stock or custody reference.");
        }

        var disposal = new DisposalRecord
        {
            DisposalNumber = await NextNumber(DocumentType.Disposal, cancellationToken),
            ItemId = request.ItemId,
            ShelfId = request.ShelfId,
            CustodianId = request.CustodianId,
            Quantity = request.Quantity,
            Condition = request.Condition,
            DisposalMethod = request.DisposalMethod,
            Notes = request.Notes
        };

        context.DisposalRecords.Add(disposal);
        AddAttachments(DocumentType.Disposal, disposal.Id, request.Attachments);
        AddNotification(null, UserRole.ComplianceOfficer, "Disposal submitted", $"Disposal {disposal.DisposalNumber} is pending approval.", disposal.Id, disposal.DisposalNumber);
        await context.SaveChangesAsync(cancellationToken);
        return disposal;
    }

    public async Task<DisposalRecord> ApproveDisposal(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var disposal = await context.DisposalRecords.SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Disposal record was not found.");

        EnsureTransition(disposal.Status, WorkflowStatus.Disposed, disposal.DisposalNumber);
        if (disposal.ShelfId.HasValue)
        {
            var stock = await GetStock(disposal.ItemId, disposal.ShelfId.Value, cancellationToken);
            if (stock.AvailableQuantity < disposal.Quantity)
            {
                throw new BusinessRuleException("Disposal quantity is greater than available stock.");
            }

            stock.CurrentQuantity -= disposal.Quantity;
            stock.BookBalance -= disposal.Quantity;
            stock.PhysicalBalance -= disposal.Quantity;
            SynchronizeStock(stock);
            context.StockLedgers.Add(CreateLedger(
                disposal.ItemId,
                disposal.ShelfId.Value,
                -disposal.Quantity,
                stock.CurrentQuantity,
                StockTransactionType.Disposal,
                DocumentType.Disposal,
                disposal.Id,
                disposal.DisposalNumber,
                null,
                request.Remark));
        }

        if (disposal.CustodianId.HasValue)
        {
            await ReduceCustody(disposal.CustodianId.Value, disposal.ItemId, disposal.Quantity, cancellationToken);
        }

        disposal.ApprovedById = request.ActorId;
        disposal.Status = WorkflowStatus.Disposed;
        AddAudit(request.ActorId, "ApprovedDisposal", nameof(DisposalRecord), disposal.Id, disposal.DisposalNumber);
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return disposal;
    }

    public async Task<AnnualInventory> CreateAnnualInventory(
        CreateAnnualInventoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var annualInventory = new AnnualInventory
        {
            InventoryNumber = await NextNumber(DocumentType.AnnualInventory, cancellationToken),
            FiscalYear = request.FiscalYear,
            Location = request.Location,
            CountedById = request.CountedById,
            Lines = request.Lines.Select(line => new AnnualInventoryLine
            {
                ItemId = line.ItemId,
                ShelfId = line.ShelfId,
                ExpectedQuantity = line.ExpectedQuantity,
                CountedQuantity = line.CountedQuantity,
                Discrepancy = line.CountedQuantity - line.ExpectedQuantity,
                Notes = line.Notes
            }).ToList()
        };

        context.AnnualInventories.Add(annualInventory);
        AddAudit(request.CountedById, "Created", nameof(AnnualInventory), annualInventory.Id, annualInventory.InventoryNumber);
        await context.SaveChangesAsync(cancellationToken);
        return annualInventory;
    }

    public async Task<AnnualInventory> CompleteAnnualInventory(
        Guid id,
        ApproveRequest request,
        CancellationToken cancellationToken = default)
    {
        var annualInventory = await context.AnnualInventories
            .Include(value => value.Lines)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new BusinessRuleException("Annual inventory was not found.");

        EnsureTransition(annualInventory.Status, WorkflowStatus.Closed, annualInventory.InventoryNumber);
        annualInventory.Status = WorkflowStatus.Closed;
        if (annualInventory.Lines.Any(line => line.Discrepancy != 0))
        {
            AddNotification(null, UserRole.DepartmentManager, "Annual inventory discrepancy", $"Inventory {annualInventory.InventoryNumber} contains discrepancies.", annualInventory.Id, annualInventory.InventoryNumber);
        }

        AddAudit(request.ActorId, "Completed", nameof(AnnualInventory), annualInventory.Id, request.Remark);
        await context.SaveChangesAsync(cancellationToken);
        return annualInventory;
    }

    private async Task<string> NextNumber(DocumentType documentType, CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var sequence = await context.DocumentSequences
            .SingleOrDefaultAsync(value => value.DocumentType == documentType && value.Year == year, cancellationToken);

        if (sequence is null)
        {
            sequence = new DocumentSequence
            {
                DocumentType = documentType,
                Year = year,
                NextNumber = 1
            };
            context.DocumentSequences.Add(sequence);
        }

        var value = sequence.NextNumber;
        sequence.NextNumber++;
        return $"{documentType}-{year}-{value:00000}";
    }

    private async Task<InventoryStock> GetOrCreateStock(Guid itemId, Guid shelfId, CancellationToken cancellationToken)
    {
        var stock = await context.InventoryStocks
            .SingleOrDefaultAsync(value => value.ItemId == itemId && value.ShelfId == shelfId, cancellationToken);

        if (stock is not null)
        {
            return stock;
        }

        stock = new InventoryStock
        {
            ItemId = itemId,
            ShelfId = shelfId
        };
        context.InventoryStocks.Add(stock);
        return stock;
    }

    private async Task<InventoryStock> GetStock(Guid itemId, Guid shelfId, CancellationToken cancellationToken)
    {
        return await context.InventoryStocks
            .SingleOrDefaultAsync(value => value.ItemId == itemId && value.ShelfId == shelfId, cancellationToken)
            ?? throw new BusinessRuleException("Stock record was not found.");
    }

    private async Task<InventoryStock> FindStockForIssue(Guid itemId, int quantity, CancellationToken cancellationToken)
    {
        return await context.InventoryStocks
            .Where(value => value.ItemId == itemId && value.CurrentQuantity - value.ReservedQuantity >= quantity)
            .OrderBy(value => value.CreatedDate)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new BusinessRuleException("No shelf has enough available stock for the requested item.");
    }

    private async Task AddCustody(
        Guid custodianId,
        Guid itemId,
        int quantity,
        string documentNumber,
        string? tagNumber,
        string? serialNumber,
        CancellationToken cancellationToken)
    {
        var custody = await context.UserCustodies
            .FirstOrDefaultAsync(value =>
                value.CustodianId == custodianId
                && value.ItemId == itemId
                && value.TagNumber == tagNumber
                && value.SerialNumber == serialNumber,
                cancellationToken);

        if (custody is null)
        {
            context.UserCustodies.Add(new UserCustody
            {
                CustodianId = custodianId,
                ItemId = itemId,
                Quantity = quantity,
                SourceDocumentNumber = documentNumber,
                TagNumber = tagNumber,
                SerialNumber = serialNumber
            });
            return;
        }

        custody.Quantity += quantity;
    }

    private async Task ReduceCustody(Guid custodianId, Guid itemId, int quantity, CancellationToken cancellationToken)
    {
        var custody = await context.UserCustodies
            .Where(value => value.CustodianId == custodianId && value.ItemId == itemId && value.Quantity > 0)
            .OrderBy(value => value.CreatedDate)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new BusinessRuleException("Custody record was not found.");

        if (custody.Quantity < quantity)
        {
            throw new BusinessRuleException("Custody quantity is not enough for the requested action.");
        }

        custody.Quantity -= quantity;
    }

    private void AddAttachments(DocumentType documentType, Guid referenceId, IReadOnlyList<AttachmentRequest>? attachments)
    {
        if (attachments is null)
        {
            return;
        }

        foreach (var attachment in attachments)
        {
            context.DocumentAttachments.Add(new DocumentAttachment
            {
                DocumentType = documentType,
                ReferenceId = referenceId,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                StoragePath = attachment.StoragePath,
                UploadedById = attachment.UploadedById
            });
        }
    }

    private void AddNotification(
        Guid? recipientId,
        string title,
        string message,
        Guid referenceId,
        string referenceNumber)
    {
        AddNotification(recipientId, null, title, message, referenceId, referenceNumber);
    }

    private void AddNotification(
        Guid? recipientId,
        UserRole? role,
        string title,
        string message,
        Guid referenceId,
        string referenceNumber)
    {
        context.NotificationEvents.Add(new NotificationEvent
        {
            RecipientId = recipientId,
            RecipientRole = role,
            Title = title,
            Message = message,
            ReferenceId = referenceId,
            ReferenceNumber = referenceNumber
        });
    }

    private void AddAudit(Guid? userId, string action, string entityName, Guid entityId, string? details)
    {
        context.AuditTrails.Add(new AuditTrail
        {
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = details
        });
    }

    private static StockLedger CreateLedger(
        Guid itemId,
        Guid shelfId,
        int quantityChange,
        int balanceAfter,
        StockTransactionType transactionType,
        DocumentType? documentType,
        Guid? referenceId,
        string? referenceNumber,
        decimal? unitCost,
        string? reason)
    {
        return new StockLedger
        {
            ItemId = itemId,
            ShelfId = shelfId,
            QuantityChange = quantityChange,
            BalanceAfter = balanceAfter,
            TransactionType = transactionType,
            DocumentType = documentType,
            ReferenceId = referenceId,
            ReferenceNumber = referenceNumber,
            UnitCost = unitCost,
            Reason = reason
        };
    }

    private static void SynchronizeStock(InventoryStock stock)
    {
        if (stock.CurrentQuantity < 0)
        {
            throw new BusinessRuleException("Stock current quantity cannot be negative.");
        }

        if (stock.ReservedQuantity < 0)
        {
            throw new BusinessRuleException("Stock reserved quantity cannot be negative.");
        }

        if (stock.ReservedQuantity > stock.CurrentQuantity)
        {
            throw new BusinessRuleException("Reserved quantity cannot exceed current quantity.");
        }

        stock.Discrepancy = stock.PhysicalBalance - stock.BookBalance;
    }

    private static void EnsureTransition(WorkflowStatus current, WorkflowStatus next, string documentNumber)
    {
        if (current == next)
        {
            throw new BusinessRuleException($"{documentNumber} is already {next}.");
        }

        if (!AllowedTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next))
        {
            throw new BusinessRuleException($"{documentNumber} cannot move from {current} to {next}.");
        }
    }

    private static readonly IReadOnlyDictionary<WorkflowStatus, WorkflowStatus[]> AllowedTransitions =
        new Dictionary<WorkflowStatus, WorkflowStatus[]>
        {
            [WorkflowStatus.Draft] = [WorkflowStatus.Submitted, WorkflowStatus.Cancelled],
            [WorkflowStatus.Submitted] = [WorkflowStatus.PendingApproval, WorkflowStatus.Approved, WorkflowStatus.Rejected, WorkflowStatus.Cancelled, WorkflowStatus.Returned, WorkflowStatus.Transferred, WorkflowStatus.Disposed, WorkflowStatus.Closed],
            [WorkflowStatus.PendingApproval] = [WorkflowStatus.Approved, WorkflowStatus.Rejected, WorkflowStatus.Cancelled],
            [WorkflowStatus.Approved] = [WorkflowStatus.Issued, WorkflowStatus.Closed, WorkflowStatus.Disposed, WorkflowStatus.Transferred, WorkflowStatus.Returned],
            [WorkflowStatus.Received] = [WorkflowStatus.InspectionPending, WorkflowStatus.Closed],
            [WorkflowStatus.InspectionPending] = [WorkflowStatus.InspectionPassed, WorkflowStatus.InspectionFailed],
            [WorkflowStatus.InspectionPassed] = [WorkflowStatus.Closed],
            [WorkflowStatus.InspectionFailed] = [WorkflowStatus.Rejected, WorkflowStatus.Closed],
            [WorkflowStatus.Issued] = [WorkflowStatus.Closed, WorkflowStatus.Returned],
            [WorkflowStatus.Returned] = [WorkflowStatus.Closed],
            [WorkflowStatus.Transferred] = [WorkflowStatus.Closed],
            [WorkflowStatus.Disposed] = [WorkflowStatus.Closed]
        };
}
