using AutoMapper;
using MediatR;
using PMS.Application.Contracts.IRepository;
using PMS.Application.DTO;
using PMS.Domain.Common;
using PMS.Domain.Entities;

namespace PMS.Application.CQRS;

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

public class MasterDataQueryHandler(
    IGenericRepository<Category> categoryRepository,
    IGenericRepository<ItemMaster> itemRepository,
    IGenericRepository<Warehouse> warehouseRepository,
    IGenericRepository<ShelfLocation> shelfRepository,
    IGenericRepository<Supplier> supplierRepository,
    IGenericRepository<AppUser> userRepository)
    : IRequestHandler<GetCategoriesQuery, IReadOnlyList<Category>>,
        IRequestHandler<GetItemsQuery, IReadOnlyList<ItemMaster>>,
        IRequestHandler<GetWarehousesQuery, IReadOnlyList<Warehouse>>,
        IRequestHandler<GetShelvesQuery, IReadOnlyList<ShelfLocation>>,
        IRequestHandler<GetSuppliersQuery, IReadOnlyList<Supplier>>,
        IRequestHandler<GetUsersQuery, IReadOnlyList<AppUserDto>>
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

public class MasterDataCommandHandler(
    IGenericRepository<Category> categoryRepository,
    IGenericRepository<ItemMaster> itemRepository,
    IGenericRepository<Warehouse> warehouseRepository,
    IGenericRepository<ShelfLocation> shelfRepository,
    IGenericRepository<Supplier> supplierRepository,
    IGenericRepository<AppUser> userRepository,
    IMapper mapper)
    : IRequestHandler<CreateCategoryCommand, Category>,
        IRequestHandler<UpdateCategoryCommand, Category?>,
        IRequestHandler<CreateItemCommand, ItemMaster>,
        IRequestHandler<UpdateItemCommand, ItemMaster?>,
        IRequestHandler<CreateWarehouseCommand, Warehouse>,
        IRequestHandler<CreateShelfCommand, ShelfLocation>,
        IRequestHandler<CreateSupplierCommand, Supplier>,
        IRequestHandler<CreateUserCommand, AppUserDto>
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

    private static Task<T> Add<T>(
        IGenericRepository<T> repository,
        T entity,
        CancellationToken cancellationToken)
        where T : BaseDomainEntity
    {
        return repository.Add(entity, cancellationToken);
    }
}
