using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using PMS.API.Authorization;
using PMS.Application.DTO;
using PMS.Domain.Entities;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/master-data")]
[Authorize]
public class MasterDataController(PMSDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("categories")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        return Ok(await context.Categories.AsNoTracking().OrderBy(value => value.Name).ToListAsync(cancellationToken));
    }

    [HttpPost("categories")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = mapper.Map<Category>(request);

        context.Categories.Add(category);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(category);
    }

    [HttpPut("categories/{id:guid}")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> UpdateCategory(Guid id, CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await context.Categories.FindAsync([id], cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.ParentCategoryId = request.ParentCategoryId;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(category);
    }

    [HttpGet("items")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        return Ok(await context.ItemMasters
            .AsNoTracking()
            .Include(value => value.Category)
            .OrderBy(value => value.ItemName)
            .ToListAsync(cancellationToken));
    }

    [HttpPost("items")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateItem(CreateItemRequest request, CancellationToken cancellationToken)
    {
        var item = mapper.Map<ItemMaster>(request);

        context.ItemMasters.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpPut("items/{id:guid}")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> UpdateItem(Guid id, CreateItemRequest request, CancellationToken cancellationToken)
    {
        var item = await context.ItemMasters.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        item.Sku = request.Sku;
        item.ItemName = request.ItemName;
        item.Description = request.Description;
        item.CategoryId = request.CategoryId;
        item.PropertyType = request.PropertyType;
        item.UnitOfMeasure = request.UnitOfMeasure;
        item.RequiresInspection = request.RequiresInspection;
        item.MinStockLevel = request.MinStockLevel;
        item.UnitCost = request.UnitCost;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpGet("warehouses")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetWarehouses(CancellationToken cancellationToken)
    {
        return Ok(await context.Warehouses.AsNoTracking().OrderBy(value => value.WarehouseName).ToListAsync(cancellationToken));
    }

    [HttpPost("warehouses")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateWarehouse(CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var warehouse = mapper.Map<Warehouse>(request);

        context.Warehouses.Add(warehouse);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(warehouse);
    }

    [HttpGet("shelves")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetShelves(CancellationToken cancellationToken)
    {
        return Ok(await context.ShelfLocations
            .AsNoTracking()
            .Include(value => value.Warehouse)
            .OrderBy(value => value.Warehouse!.LocationCode)
            .ThenBy(value => value.ShelfNumber)
            .ToListAsync(cancellationToken));
    }

    [HttpPost("shelves")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateShelf(CreateShelfLocationRequest request, CancellationToken cancellationToken)
    {
        var shelf = mapper.Map<ShelfLocation>(request);

        context.ShelfLocations.Add(shelf);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(shelf);
    }

    [HttpGet("suppliers")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> GetSuppliers(CancellationToken cancellationToken)
    {
        return Ok(await context.Suppliers.AsNoTracking().OrderBy(value => value.SupplierName).ToListAsync(cancellationToken));
    }

    [HttpPost("suppliers")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> CreateSupplier(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = mapper.Map<Supplier>(request);

        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(supplier);
    }

    [HttpGet("users")]
    [Authorize(Roles = PasRoles.PropertyAdmin)]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        return Ok(await context.Users.AsNoTracking().OrderBy(value => value.FullName).ToListAsync(cancellationToken));
    }

    [HttpPost("users")]
    [Authorize(Roles = PasRoles.PropertyAdmin)]
    public async Task<IActionResult> CreateUser(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var user = mapper.Map<AppUser>(request);

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);
        return Ok(user);
    }
}
