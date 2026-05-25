using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

/// <summary>
/// SR004 / FR0018: Safety Box Management — create/manage safety boxes,
/// shelves within boxes, and view safety box status dashboard.
/// </summary>
[ApiController]
[Route("api/safety-boxes")]
[Authorize]
public class SafetyBoxController(IMediator mediator, PMSDbContext context) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var boxes = await context.SafetyBoxes
            .Include(b => b.Warehouse)
            .Include(b => b.Shelves)
            .OrderBy(b => b.BoxNumber)
            .ToListAsync(cancellationToken);

        return Ok(boxes.Select(b => new
        {
            b.Id, b.BoxNumber, b.Description, b.Category,
            b.TotalShelves, b.IsActive,
            Warehouse = b.Warehouse?.WarehouseName,
            ActiveShelves = b.Shelves.Count
        }));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var box = await context.SafetyBoxes
            .Include(b => b.Warehouse)
            .Include(b => b.Shelves).ThenInclude(s => s.ShelfLocation)
            .SingleOrDefaultAsync(b => b.Id == id, cancellationToken);

        return box is null ? NotFound() : Ok(box);
    }

    [HttpPost]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> Create(CreateSafetyBoxRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateSafetyBoxCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("shelves")]
    [Authorize(Roles = PasRoles.AdminOrStorekeeper)]
    public async Task<IActionResult> CreateShelf(CreateSafetyBoxShelfRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateSafetyBoxShelfCommand(request), cancellationToken));
    }

    /// <summary>FR0018: Safety Box dashboard — shows status per box with variance.</summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var boxes = await context.SafetyBoxes
            .Include(b => b.Shelves).ThenInclude(s => s.ShelfLocation)
            .Where(b => b.IsActive)
            .ToListAsync(cancellationToken);

        var shelfLocationIds = boxes
            .SelectMany(b => b.Shelves)
            .Where(s => s.ShelfLocationId.HasValue)
            .Select(s => s.ShelfLocationId!.Value)
            .Distinct()
            .ToList();

        var stocks = await context.InventoryStocks
            .Where(s => shelfLocationIds.Contains(s.ShelfId))
            .ToListAsync(cancellationToken);

        var dashboard = boxes.Select(box =>
        {
            var boxShelfIds = box.Shelves.Where(s => s.ShelfLocationId.HasValue).Select(s => s.ShelfLocationId!.Value);
            var boxStocks = stocks.Where(s => boxShelfIds.Contains(s.ShelfId));
            return new
            {
                box.Id, box.BoxNumber, box.Description, box.Category,
                TotalShelves = box.Shelves.Count,
                TotalItems = boxStocks.Sum(s => s.CurrentQuantity),
                TotalReserved = boxStocks.Sum(s => s.ReservedQuantity),
                TotalAvailable = boxStocks.Sum(s => s.AvailableQuantity),
                TotalDiscrepancy = boxStocks.Sum(s => s.Discrepancy)
            };
        });

        return Ok(dashboard);
    }
}
