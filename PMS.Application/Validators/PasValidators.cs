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

public class CreateStoreRequestRequestValidator : AbstractValidator<CreateStoreRequestRequest>
{
    public CreateStoreRequestRequestValidator()
    {
        RuleFor(request => request.RequesterId).NotEmpty();
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
