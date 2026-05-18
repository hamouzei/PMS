using FluentValidation;
using PMS.Application.DTO;

namespace PMS.Application.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().MaximumLength(150);
    }
}

public class CreateItemRequestValidator : AbstractValidator<CreateItemRequest>
{
    public CreateItemRequestValidator()
    {
        RuleFor(request => request.Sku).NotEmpty().MaximumLength(80);
        RuleFor(request => request.ItemName).NotEmpty().MaximumLength(200);
        RuleFor(request => request.UnitOfMeasure).NotEmpty().MaximumLength(50);
        RuleFor(request => request.MinStockLevel).GreaterThanOrEqualTo(0);
        RuleFor(request => request.UnitCost).GreaterThanOrEqualTo(0);
    }
}

public class StockLineRequestValidator : AbstractValidator<StockLineRequest>
{
    public StockLineRequestValidator()
    {
        RuleFor(request => request.ItemId).NotEmpty();
        RuleFor(request => request.Quantity).GreaterThan(0);
    }
}

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(request => request.EmployeeId).NotEmpty().MaximumLength(80);
        RuleFor(request => request.UserName).NotEmpty().MaximumLength(100);
        RuleFor(request => request.FullName).NotEmpty().MaximumLength(200);
        RuleFor(request => request.Password).NotEmpty().MinimumLength(8);
    }
}

public class RegisterOpeningBalanceRequestValidator : AbstractValidator<RegisterOpeningBalanceRequest>
{
    public RegisterOpeningBalanceRequestValidator()
    {
        RuleFor(request => request.ItemId).NotEmpty();
        RuleFor(request => request.ShelfId).NotEmpty();
        RuleFor(request => request.Quantity).GreaterThanOrEqualTo(0);
        RuleFor(request => request.UnitCost).GreaterThanOrEqualTo(0).When(request => request.UnitCost.HasValue);
    }
}

public class StockAdjustmentRequestValidator : AbstractValidator<StockAdjustmentRequest>
{
    public StockAdjustmentRequestValidator()
    {
        RuleFor(request => request.ItemId).NotEmpty();
        RuleFor(request => request.ShelfId).NotEmpty();
        RuleFor(request => request.QuantityChange).NotEqual(0);
        RuleFor(request => request.Reason).NotEmpty().MaximumLength(500);
    }
}

public class CreateStoreRequestRequestValidator : AbstractValidator<CreateStoreRequestRequest>
{
    public CreateStoreRequestRequestValidator()
    {
        RuleFor(request => request.RequesterId).NotEmpty();
        RuleFor(request => request.Details).NotEmpty();
        RuleForEach(request => request.Details).SetValidator(new StockLineRequestValidator());
    }
}

public class CreatePurchaseRequestRequestValidator : AbstractValidator<CreatePurchaseRequestRequest>
{
    public CreatePurchaseRequestRequestValidator()
    {
        RuleFor(request => request.RequesterId).NotEmpty();
        RuleFor(request => request.EstimatedBudget).GreaterThanOrEqualTo(0).When(request => request.EstimatedBudget.HasValue);
        RuleFor(request => request.Details).NotEmpty();
        RuleForEach(request => request.Details).SetValidator(new StockLineRequestValidator());
    }
}

public class CreateReceivingNoteRequestValidator : AbstractValidator<CreateReceivingNoteRequest>
{
    public CreateReceivingNoteRequestValidator()
    {
        RuleFor(request => request.SupplierId).NotEmpty();
        RuleFor(request => request.WarehouseId).NotEmpty();
        RuleFor(request => request.ReceivedById).NotEmpty();
        RuleFor(request => request.Details).NotEmpty();
        RuleForEach(request => request.Details).SetValidator(new StockLineRequestValidator());
    }
}

public class RecordInspectionRequestValidator : AbstractValidator<RecordInspectionRequest>
{
    public RecordInspectionRequestValidator()
    {
        RuleFor(request => request.ReceivingNoteId).NotEmpty();
        RuleFor(request => request.InspectorId).NotEmpty();
        RuleFor(request => request.DeviationNotes).NotEmpty().When(request => !request.IsPassed);
    }
}

public class ReleaseReceivingRequestValidator : AbstractValidator<ReleaseReceivingRequest>
{
    public ReleaseReceivingRequestValidator()
    {
        RuleFor(request => request.ReceivingNoteId).NotEmpty();
        RuleFor(request => request.ReleasedById).NotEmpty();
    }
}

public class ApproveRequestValidator : AbstractValidator<ApproveRequest>
{
    public ApproveRequestValidator()
    {
        RuleFor(request => request.ActorId).NotEmpty();
    }
}

public class RejectRequestValidator : AbstractValidator<RejectRequest>
{
    public RejectRequestValidator()
    {
        RuleFor(request => request.ActorId).NotEmpty();
        RuleFor(request => request.Reason).NotEmpty().MaximumLength(500);
    }
}

public class IssueStockRequestValidator : AbstractValidator<IssueStockRequest>
{
    public IssueStockRequestValidator()
    {
        RuleFor(request => request.ServiceRequestId).NotEmpty();
        RuleFor(request => request.IssuedById).NotEmpty();
    }
}

public class CreateReturnRequestValidator : AbstractValidator<CreateReturnRequest>
{
    public CreateReturnRequestValidator()
    {
        RuleFor(request => request.ReturnedById).NotEmpty();
        RuleFor(request => request.Details).NotEmpty();
        RuleForEach(request => request.Details).ChildRules(line =>
        {
            line.RuleFor(value => value.ItemId).NotEmpty();
            line.RuleFor(value => value.ShelfId).NotEmpty();
            line.RuleFor(value => value.Quantity).GreaterThan(0);
        });
    }
}

public class CreateTransferRequestValidator : AbstractValidator<CreateTransferRequest>
{
    public CreateTransferRequestValidator()
    {
        RuleFor(request => request.FromCustodianId).NotEmpty();
        RuleFor(request => request.ToCustodianId).NotEmpty();
        RuleFor(request => request.ToCustodianId).NotEqual(request => request.FromCustodianId);
        RuleFor(request => request.Details).NotEmpty();
        RuleForEach(request => request.Details).ChildRules(line =>
        {
            line.RuleFor(value => value.ItemId).NotEmpty();
            line.RuleFor(value => value.Quantity).GreaterThan(0);
        });
    }
}

public class CreateDisposalRequestValidator : AbstractValidator<CreateDisposalRequest>
{
    public CreateDisposalRequestValidator()
    {
        RuleFor(request => request.ItemId).NotEmpty();
        RuleFor(request => request.Quantity).GreaterThan(0);
        RuleFor(request => request)
            .Must(request => request.ShelfId.HasValue || request.CustodianId.HasValue)
            .WithMessage("Disposal requires either shelf stock or custody reference.");
    }
}

public class CreateAnnualInventoryRequestValidator : AbstractValidator<CreateAnnualInventoryRequest>
{
    public CreateAnnualInventoryRequestValidator()
    {
        RuleFor(request => request.FiscalYear).InclusiveBetween(2000, 2100);
        RuleFor(request => request.Location).NotEmpty().MaximumLength(150);
        RuleFor(request => request.CountedById).NotEmpty();
        RuleFor(request => request.Lines).NotEmpty();
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.EmployeeId).NotEmpty();
        RuleFor(request => request.UserName).NotEmpty();
        RuleFor(request => request.Password).NotEmpty();
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(request => request.RefreshToken).NotEmpty();
    }
}
