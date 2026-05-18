using FluentValidation;
using PMS.Application.CQRS;

namespace PMS.Application.Validators;

public class RegisterOpeningBalanceCommandValidator : AbstractValidator<RegisterOpeningBalanceCommand>
{
    public RegisterOpeningBalanceCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new RegisterOpeningBalanceRequestValidator());
    }
}

public class AdjustStockCommandValidator : AbstractValidator<AdjustStockCommand>
{
    public AdjustStockCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new StockAdjustmentRequestValidator());
    }
}

public class CreateStoreRequestCommandValidator : AbstractValidator<CreateStoreRequestCommand>
{
    public CreateStoreRequestCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateStoreRequestRequestValidator());
    }
}

public class CreatePurchaseRequestCommandValidator : AbstractValidator<CreatePurchaseRequestCommand>
{
    public CreatePurchaseRequestCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreatePurchaseRequestRequestValidator());
    }
}

public class CreateReceivingNoteCommandValidator : AbstractValidator<CreateReceivingNoteCommand>
{
    public CreateReceivingNoteCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateReceivingNoteRequestValidator());
    }
}

public class RecordInspectionCommandValidator : AbstractValidator<RecordInspectionCommand>
{
    public RecordInspectionCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new RecordInspectionRequestValidator());
    }
}

public class ReleaseReceivingCommandValidator : AbstractValidator<ReleaseReceivingCommand>
{
    public ReleaseReceivingCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new ReleaseReceivingRequestValidator());
    }
}

public class IssueStockCommandValidator : AbstractValidator<IssueStockCommand>
{
    public IssueStockCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new IssueStockRequestValidator());
    }
}

public class CreateReturnCommandValidator : AbstractValidator<CreateReturnCommand>
{
    public CreateReturnCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateReturnRequestValidator());
    }
}

public class CreateTransferCommandValidator : AbstractValidator<CreateTransferCommand>
{
    public CreateTransferCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateTransferRequestValidator());
    }
}

public class CreateDisposalCommandValidator : AbstractValidator<CreateDisposalCommand>
{
    public CreateDisposalCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateDisposalRequestValidator());
    }
}

public class CreateAnnualInventoryCommandValidator : AbstractValidator<CreateAnnualInventoryCommand>
{
    public CreateAnnualInventoryCommandValidator()
    {
        RuleFor(command => command.Request).SetValidator(new CreateAnnualInventoryRequestValidator());
    }
}
