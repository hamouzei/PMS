using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediatR;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/master-data")]
[Authorize]
public class MasterDataController(IMediator mediator, PMSDbContext context) : ControllerBase
{
    // ── Categories ───────────────────────────────────────────────────────────
    [HttpGet("categories")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetCategoriesQuery(), cancellationToken));
    }

    [HttpPost("categories")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateCategory(CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateCategoryCommand(request), cancellationToken));
    }

    [HttpPut("categories/{id:guid}")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> UpdateCategory(Guid id, CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    // ── Items ────────────────────────────────────────────────────────────────
    [HttpGet("items")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetItemsQuery(), cancellationToken));
    }

    [HttpGet("items/{id:guid}")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetItemById(Guid id, CancellationToken cancellationToken)
    {
        var item = await context.ItemMasters.AsNoTracking()
            .Include(i => i.Category)
            .Include(i => i.FieldValues).ThenInclude(fv => fv.PropertyField)
            .SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("items")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateItem(CreateItemRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateItemCommand(request), cancellationToken));
    }

    [HttpPut("items/{id:guid}")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> UpdateItem(Guid id, CreateItemRequest request, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new UpdateItemCommand(id, request), cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    // ── Search / Autocomplete (SR003 quick lookup) ───────────────────────────
    [HttpGet("items/search")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> SearchItems([FromQuery] string? q, [FromQuery] int max = 25, CancellationToken cancellationToken = default)
    {
        var query = context.ItemMasters.AsNoTracking().Where(i => i.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(i => i.ItemName.Contains(q) || i.Sku.Contains(q));
        return Ok(await query.Take(max).Select(i => new { i.Id, i.Sku, i.ItemName, i.UnitOfMeasure, i.PropertyType }).ToListAsync(cancellationToken));
    }

    [HttpGet("categories/search")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> SearchCategories([FromQuery] string? q, [FromQuery] int max = 25, CancellationToken cancellationToken = default)
    {
        var query = context.Categories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(c => c.Name.Contains(q));
        return Ok(await query.Take(max).Select(c => new { c.Id, c.Name, c.ParentCategoryId }).ToListAsync(cancellationToken));
    }

    [HttpGet("users/search")]
    [Authorize]
    public async Task<IActionResult> SearchUsers([FromQuery] string? q, [FromQuery] int max = 25, CancellationToken cancellationToken = default)
    {
        var query = context.Users.AsNoTracking().Where(u => u.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(u => u.FullName.Contains(q) || u.EmployeeId.Contains(q));
        return Ok(await query.Take(max).Select(u => new { u.Id, u.EmployeeId, u.FullName, u.Role, u.Department }).ToListAsync(cancellationToken));
    }

    [HttpGet("warehouses/search")]
    [Authorize]
    public async Task<IActionResult> SearchWarehouses([FromQuery] string? q, [FromQuery] int max = 25, CancellationToken cancellationToken = default)
    {
        var query = context.Warehouses.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(w => w.WarehouseName.Contains(q) || w.LocationCode.Contains(q));
        return Ok(await query.Take(max).Select(w => new { w.Id, w.WarehouseName, w.LocationCode, w.LocationType }).ToListAsync(cancellationToken));
    }

    // ── Warehouses ───────────────────────────────────────────────────────────
    [HttpGet("warehouses")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetWarehouses(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetWarehousesQuery(), cancellationToken));
    }

    [HttpPost("warehouses")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateWarehouse(CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateWarehouseCommand(request), cancellationToken));
    }

    // ── Shelves ──────────────────────────────────────────────────────────────
    [HttpGet("shelves")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetShelves(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetShelvesQuery(), cancellationToken));
    }

    [HttpPost("shelves")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateShelf(CreateShelfLocationRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateShelfCommand(request), cancellationToken));
    }

    // ── Suppliers ────────────────────────────────────────────────────────────
    [HttpGet("suppliers")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> GetSuppliers(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetSuppliersQuery(), cancellationToken));
    }

    [HttpPost("suppliers")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> CreateSupplier(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateSupplierCommand(request), cancellationToken));
    }

    // ── Users ────────────────────────────────────────────────────────────────
    [HttpGet("users")]
    [Authorize(Roles = PasRoles.PropertyAdmin)]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetUsersQuery(), cancellationToken));
    }

    [HttpPost("users")]
    [Authorize(Roles = PasRoles.PropertyAdmin)]
    public async Task<IActionResult> CreateUser(CreateUserRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateUserCommand(request), cancellationToken));
    }

    // ── SR003: Custom Property Fields ────────────────────────────────────────
    [HttpGet("property-fields")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> GetPropertyFields(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetPropertyFieldsQuery(), cancellationToken));
    }

    [HttpPost("property-fields")]
    [Authorize(Roles = PasRoles.PropertyAdmin)]
    public async Task<IActionResult> CreatePropertyField(CreatePropertyFieldRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreatePropertyFieldCommand(request), cancellationToken));
    }

    [HttpPost("property-field-values")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> SetPropertyFieldValue(SetPropertyFieldValueRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new SetPropertyFieldValueCommand(request), cancellationToken));
    }
}
