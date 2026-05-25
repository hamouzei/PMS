using AutoMapper;
using MediatR;
using PMS.Application.Contracts.IRepository;
using PMS.Application.DTO;
using PMS.Domain.Common;
using PMS.Domain.Entities;

namespace PMS.Application.CQRS;

// ── Query definitions ────────────────────────────────────────────────────────

public record GetCategoriesQuery : IRequest<IReadOnlyList<Category>>;
public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<Category>;
public record UpdateCategoryCommand(Guid Id, CreateCategoryRequest Request) : IRequest<Category?>;
public record GetItemsQuery : IRequest<IReadOnlyList<ItemMaster>>;
public record CreateItemCommand(CreateItemRequest Request) : IRequest<ItemMaster>;
public record UpdateItemCommand(Guid Id, CreateItemRequest Request) : IRequest<ItemMaster?>;
public record GetWarehousesQuery : IRequest<IReadOnlyList<Warehouse>>;
public record CreateWarehouseCommand(CreateWarehouseRequest Request) : IRequest<Warehouse>;
public record GetShelvesQuery : IRequest<IReadOnlyList<ShelfLocation>>;
public record CreateShelfCommand(CreateShelfLocationRequest Request) : IRequest<ShelfLocation>;
public record GetSuppliersQuery : IRequest<IReadOnlyList<Supplier>>;
public record CreateSupplierCommand(CreateSupplierRequest Request) : IRequest<Supplier>;
public record GetUsersQuery : IRequest<IReadOnlyList<AppUserDto>>;
public record CreateUserCommand(CreateUserRequest Request) : IRequest<AppUserDto>;
public record UpdateUserCommand(Guid Id, UpdateUserRequest Request) : IRequest<AppUserDto?>;
public record ResetUserPasswordCommand(Guid Id, ResetPasswordRequest Request) : IRequest<bool>;
public record GetSafetyBoxesQuery : IRequest<IReadOnlyList<SafetyBox>>;
public record CreateSafetyBoxCommand(CreateSafetyBoxRequest Request) : IRequest<SafetyBox>;
public record CreateSafetyBoxShelfCommand(CreateSafetyBoxShelfRequest Request) : IRequest<SafetyBoxShelf>;
public record GetPropertyFieldsQuery : IRequest<IReadOnlyList<PropertyField>>;
public record CreatePropertyFieldCommand(CreatePropertyFieldRequest Request) : IRequest<PropertyField>;
public record SetPropertyFieldValueCommand(SetPropertyFieldValueRequest Request) : IRequest<PropertyFieldValue>;
public record GetBudgetAllocationsQuery(int? FiscalYear) : IRequest<IReadOnlyList<BudgetAllocation>>;
public record CreateBudgetAllocationCommand(CreateBudgetAllocationRequest Request) : IRequest<BudgetAllocation>;

// ── Query handler ────────────────────────────────────────────────────────────

public class MasterDataQueryHandler(
    IGenericRepository<Category> categoryRepository,
    IGenericRepository<ItemMaster> itemRepository,
    IGenericRepository<Warehouse> warehouseRepository,
    IGenericRepository<ShelfLocation> shelfRepository,
    IGenericRepository<Supplier> supplierRepository,
    IGenericRepository<AppUser> userRepository,
    IGenericRepository<SafetyBox> safetyBoxRepository,
    IGenericRepository<PropertyField> propertyFieldRepository,
    IGenericRepository<BudgetAllocation> budgetRepository)
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<Category>>,
        IRequestHandler<GetItemsQuery, IReadOnlyList<ItemMaster>>,
        IRequestHandler<GetWarehousesQuery, IReadOnlyList<Warehouse>>,
        IRequestHandler<GetShelvesQuery, IReadOnlyList<ShelfLocation>>,
        IRequestHandler<GetSuppliersQuery, IReadOnlyList<Supplier>>,
        IRequestHandler<GetUsersQuery, IReadOnlyList<AppUserDto>>,
        IRequestHandler<GetSafetyBoxesQuery, IReadOnlyList<SafetyBox>>,
        IRequestHandler<GetPropertyFieldsQuery, IReadOnlyList<PropertyField>>,
        IRequestHandler<GetBudgetAllocationsQuery, IReadOnlyList<BudgetAllocation>>
{
    public async Task<IReadOnlyList<Category>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        return (await categoryRepository.GetAll(cancellationToken)).OrderBy(value => value.Name).ToList();
    }

    public async Task<IReadOnlyList<ItemMaster>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        return (await itemRepository.GetAll(cancellationToken)).OrderBy(value => value.ItemName).ToList();
    }

    public async Task<IReadOnlyList<Warehouse>> Handle(GetWarehousesQuery request, CancellationToken cancellationToken)
    {
        return (await warehouseRepository.GetAll(cancellationToken)).OrderBy(value => value.WarehouseName).ToList();
    }

    public async Task<IReadOnlyList<ShelfLocation>> Handle(GetShelvesQuery request, CancellationToken cancellationToken)
    {
        return (await shelfRepository.GetAll(cancellationToken)).OrderBy(value => value.ShelfNumber).ToList();
    }

    public async Task<IReadOnlyList<Supplier>> Handle(GetSuppliersQuery request, CancellationToken cancellationToken)
    {
        return (await supplierRepository.GetAll(cancellationToken)).OrderBy(value => value.SupplierName).ToList();
    }

    public async Task<IReadOnlyList<AppUserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        return (await userRepository.GetAll(cancellationToken))
            .OrderBy(value => value.FullName)
            .Select(ToDto)
            .ToList();
    }

    public async Task<IReadOnlyList<SafetyBox>> Handle(GetSafetyBoxesQuery request, CancellationToken cancellationToken)
    {
        return (await safetyBoxRepository.GetAll(cancellationToken)).OrderBy(value => value.BoxNumber).ToList();
    }

    public async Task<IReadOnlyList<PropertyField>> Handle(GetPropertyFieldsQuery request, CancellationToken cancellationToken)
    {
        return (await propertyFieldRepository.GetAll(cancellationToken)).OrderBy(value => value.DisplayOrder).ToList();
    }

    public async Task<IReadOnlyList<BudgetAllocation>> Handle(GetBudgetAllocationsQuery request, CancellationToken cancellationToken)
    {
        var all = await budgetRepository.GetAll(cancellationToken);
        if (request.FiscalYear.HasValue)
            all = all.Where(b => b.FiscalYear == request.FiscalYear.Value).ToList();
        return all.OrderBy(b => b.Department).ToList();
    }

    internal static AppUserDto ToDto(AppUser user)
    {
        return new AppUserDto(
            user.Id,
            user.EmployeeId,
            user.UserName,
            user.FullName,
            user.Role,
            user.Department,
            user.Division,
            user.Location,
            user.Title,
            user.IsActive);
    }
}

// ── Command handler ──────────────────────────────────────────────────────────

public class MasterDataCommandHandler(
    IGenericRepository<Category> categoryRepository,
    IGenericRepository<ItemMaster> itemRepository,
    IGenericRepository<Warehouse> warehouseRepository,
    IGenericRepository<ShelfLocation> shelfRepository,
    IGenericRepository<Supplier> supplierRepository,
    IGenericRepository<AppUser> userRepository,
    IGenericRepository<SafetyBox> safetyBoxRepository,
    IGenericRepository<SafetyBoxShelf> safetyBoxShelfRepository,
    IGenericRepository<PropertyField> propertyFieldRepository,
    IGenericRepository<PropertyFieldValue> propertyFieldValueRepository,
    IGenericRepository<BudgetAllocation> budgetRepository,
    IMapper mapper)
    : IRequestHandler<CreateCategoryCommand, Category>,
        IRequestHandler<UpdateCategoryCommand, Category?>,
        IRequestHandler<CreateItemCommand, ItemMaster>,
        IRequestHandler<UpdateItemCommand, ItemMaster?>,
        IRequestHandler<CreateWarehouseCommand, Warehouse>,
        IRequestHandler<CreateShelfCommand, ShelfLocation>,
        IRequestHandler<CreateSupplierCommand, Supplier>,
        IRequestHandler<CreateUserCommand, AppUserDto>,
        IRequestHandler<UpdateUserCommand, AppUserDto?>,
        IRequestHandler<ResetUserPasswordCommand, bool>,
        IRequestHandler<CreateSafetyBoxCommand, SafetyBox>,
        IRequestHandler<CreateSafetyBoxShelfCommand, SafetyBoxShelf>,
        IRequestHandler<CreatePropertyFieldCommand, PropertyField>,
        IRequestHandler<SetPropertyFieldValueCommand, PropertyFieldValue>,
        IRequestHandler<CreateBudgetAllocationCommand, BudgetAllocation>
{
    public Task<Category> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        return Add(categoryRepository, mapper.Map<Category>(command.Request), cancellationToken);
    }

    public async Task<Category?> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetById(command.Id, cancellationToken);
        if (category is null)
        {
            return null;
        }

        category.Name = command.Request.Name;
        category.Description = command.Request.Description;
        category.ParentCategoryId = command.Request.ParentCategoryId;
        await categoryRepository.Update(category, cancellationToken);
        return category;
    }

    public Task<ItemMaster> Handle(CreateItemCommand command, CancellationToken cancellationToken)
    {
        return Add(itemRepository, mapper.Map<ItemMaster>(command.Request), cancellationToken);
    }

    public async Task<ItemMaster?> Handle(UpdateItemCommand command, CancellationToken cancellationToken)
    {
        var item = await itemRepository.GetById(command.Id, cancellationToken);
        if (item is null)
        {
            return null;
        }

        item.Sku = command.Request.Sku;
        item.ItemName = command.Request.ItemName;
        item.Description = command.Request.Description;
        item.CategoryId = command.Request.CategoryId;
        item.PropertyType = command.Request.PropertyType;
        item.UnitOfMeasure = command.Request.UnitOfMeasure;
        item.RequiresInspection = command.Request.RequiresInspection;
        item.MinStockLevel = command.Request.MinStockLevel;
        item.UnitCost = command.Request.UnitCost;
        await itemRepository.Update(item, cancellationToken);
        return item;
    }

    public Task<Warehouse> Handle(CreateWarehouseCommand command, CancellationToken cancellationToken)
    {
        return Add(warehouseRepository, mapper.Map<Warehouse>(command.Request), cancellationToken);
    }

    public Task<ShelfLocation> Handle(CreateShelfCommand command, CancellationToken cancellationToken)
    {
        return Add(shelfRepository, mapper.Map<ShelfLocation>(command.Request), cancellationToken);
    }

    public Task<Supplier> Handle(CreateSupplierCommand command, CancellationToken cancellationToken)
    {
        return Add(supplierRepository, mapper.Map<Supplier>(command.Request), cancellationToken);
    }

    public async Task<AppUserDto> Handle(CreateUserCommand command, CancellationToken cancellationToken)
    {
        var user = mapper.Map<AppUser>(command.Request);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(command.Request.Password);

        return MasterDataQueryHandler.ToDto(await userRepository.Add(user, cancellationToken));
    }

    // SR002: Admin user management — edit user details
    public async Task<AppUserDto?> Handle(UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetById(command.Id, cancellationToken);
        if (user is null) return null;

        if (command.Request.FullName is not null) user.FullName = command.Request.FullName;
        if (command.Request.Role.HasValue) user.Role = command.Request.Role.Value;
        if (command.Request.Department is not null) user.Department = command.Request.Department;
        if (command.Request.Division is not null) user.Division = command.Request.Division;
        if (command.Request.Location is not null) user.Location = command.Request.Location;
        if (command.Request.Title is not null) user.Title = command.Request.Title;
        if (command.Request.IsActive.HasValue) user.IsActive = command.Request.IsActive.Value;

        await userRepository.Update(user, cancellationToken);
        return MasterDataQueryHandler.ToDto(user);
    }

    // SR002: Admin — reset password
    public async Task<bool> Handle(ResetUserPasswordCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetById(command.Id, cancellationToken);
        if (user is null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(command.Request.NewPassword);
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        await userRepository.Update(user, cancellationToken);
        return true;
    }

    // SR004: Safety Box
    public Task<SafetyBox> Handle(CreateSafetyBoxCommand command, CancellationToken cancellationToken)
    {
        return Add(safetyBoxRepository, mapper.Map<SafetyBox>(command.Request), cancellationToken);
    }

    public Task<SafetyBoxShelf> Handle(CreateSafetyBoxShelfCommand command, CancellationToken cancellationToken)
    {
        return Add(safetyBoxShelfRepository, mapper.Map<SafetyBoxShelf>(command.Request), cancellationToken);
    }

    // SR003: Custom property fields
    public Task<PropertyField> Handle(CreatePropertyFieldCommand command, CancellationToken cancellationToken)
    {
        return Add(propertyFieldRepository, mapper.Map<PropertyField>(command.Request), cancellationToken);
    }

    public async Task<PropertyFieldValue> Handle(SetPropertyFieldValueCommand command, CancellationToken cancellationToken)
    {
        var existing = (await propertyFieldValueRepository.GetAll(cancellationToken))
            .FirstOrDefault(v => v.PropertyFieldId == command.Request.PropertyFieldId && v.ItemId == command.Request.ItemId);

        if (existing is not null)
        {
            existing.Value = command.Request.Value;
            await propertyFieldValueRepository.Update(existing, cancellationToken);
            return existing;
        }

        var value = new PropertyFieldValue
        {
            PropertyFieldId = command.Request.PropertyFieldId,
            ItemId = command.Request.ItemId,
            Value = command.Request.Value
        };
        return await propertyFieldValueRepository.Add(value, cancellationToken);
    }

    // SR006: Budget allocation
    public Task<BudgetAllocation> Handle(CreateBudgetAllocationCommand command, CancellationToken cancellationToken)
    {
        return Add(budgetRepository, mapper.Map<BudgetAllocation>(command.Request), cancellationToken);
    }

    private static Task<T> Add<T>(
        IGenericRepository<T> repository,
        T entity,
        CancellationToken cancellationToken)
        where T : BaseDomainEntity
    {
        return repository.Add(entity, cancellationToken);
    }
}
