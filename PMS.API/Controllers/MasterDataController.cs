using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/master-data")]
[Authorize]
public class MasterDataController(IMediator mediator) : ControllerBase
{
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
        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    [HttpGet("items")]
    [Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.AdminOrStorekeeper + "," + PasRoles.ReportViewer)]
    public async Task<IActionResult> GetItems(CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetItemsQuery(), cancellationToken));
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
        if (item is null)
        {
            return NotFound();
        }

        return Ok(item);
    }

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
}
