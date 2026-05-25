using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediatR;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Domain.Enums;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/stock")]
[Authorize(Roles = PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class StockController(
    PMSDbContext context,
    IMediator mediator,
    IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet("balances")]
    public async Task<IActionResult> GetBalances(
        [FromQuery] Guid? warehouseId,
        [FromQuery] Guid? itemId,
        [FromQuery] string? propertyType,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.InventoryStocks.AsNoTracking()
            .Include(v => v.Item)
            .Include(v => v.Shelf).ThenInclude(s => s!.Warehouse)
            .AsQueryable();

        if (warehouseId.HasValue) query = query.Where(v => v.Shelf != null && v.Shelf.WarehouseId == warehouseId.Value);
        if (itemId.HasValue) query = query.Where(v => v.ItemId == itemId.Value);
        if (!string.IsNullOrWhiteSpace(propertyType) && Enum.TryParse<PropertyType>(propertyType, true, out var pt))
            query = query.Where(v => v.Item != null && v.Item.PropertyType == pt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(v => v.Item!.ItemName)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.ItemId, v.ShelfId,
                ItemName = v.Item != null ? v.Item.ItemName : "",
                Sku = v.Item != null ? v.Item.Sku : "",
                v.CurrentQuantity, v.ReservedQuantity,
                AvailableQuantity = v.CurrentQuantity - v.ReservedQuantity,
                v.BookBalance, v.PhysicalBalance, v.Discrepancy,
                ShelfNumber = v.Shelf != null ? v.Shelf.ShelfNumber : "",
                Warehouse = v.Shelf != null && v.Shelf.Warehouse != null ? v.Shelf.Warehouse.WarehouseName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("availability/{itemId:guid}")]
    public async Task<IActionResult> GetAvailability(Guid itemId, CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks
            .AsNoTracking()
            .Where(value => value.ItemId == itemId)
            .Include(value => value.Shelf).ThenInclude(s => s!.Warehouse)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            itemId,
            currentQuantity = rows.Sum(value => value.CurrentQuantity),
            reservedQuantity = rows.Sum(value => value.ReservedQuantity),
            availableQuantity = rows.Sum(value => value.AvailableQuantity),
            shelves = rows.Select(v => new
            {
                v.Id, v.ShelfId, v.CurrentQuantity, v.ReservedQuantity,
                AvailableQuantity = v.AvailableQuantity,
                ShelfNumber = v.Shelf?.ShelfNumber,
                Warehouse = v.Shelf?.Warehouse?.WarehouseName
            })
        });
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks.AsNoTracking()
            .Include(value => value.Item)
            .Include(value => value.Shelf).ThenInclude(s => s!.Warehouse)
            .Where(value => value.Item != null && value.CurrentQuantity - value.ReservedQuantity <= value.Item.MinStockLevel)
            .Select(v => new
            {
                v.Id, v.ItemId,
                ItemName = v.Item != null ? v.Item.ItemName : "",
                v.CurrentQuantity, v.ReservedQuantity,
                AvailableQuantity = v.CurrentQuantity - v.ReservedQuantity,
                MinStockLevel = v.Item != null ? v.Item.MinStockLevel : 0,
                Warehouse = v.Shelf != null && v.Shelf.Warehouse != null ? v.Shelf.Warehouse.WarehouseName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("ledger")]
    public async Task<IActionResult> GetLedger(
        [FromQuery] Guid? itemId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.StockLedgers.AsNoTracking()
            .Include(value => value.Item)
            .Include(value => value.Shelf)
            .AsQueryable();

        if (itemId.HasValue) query = query.Where(value => value.ItemId == itemId.Value);
        if (from.HasValue) query = query.Where(v => v.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(v => v.TransactionDate <= to.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(value => value.TransactionDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.ItemId,
                ItemName = v.Item != null ? v.Item.ItemName : "",
                v.QuantityChange, v.BalanceAfter,
                TransactionType = v.TransactionType.ToString(),
                DocumentType = v.DocumentType != null ? v.DocumentType.ToString() : "",
                v.ReferenceNumber, v.UnitCost, v.Reason, v.TransactionDate
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpPost("opening-balance")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> RegisterOpeningBalance(RegisterOpeningBalanceRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new RegisterOpeningBalanceCommand(request), cancellationToken));
    }

    [HttpPost("adjustments")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> AdjustStock(StockAdjustmentRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new AdjustStockCommand(request), cancellationToken));
    }

    /// <summary>SR008/SR009: Generate ECX-format tag number.</summary>
    [HttpGet("generate-tag/{warehouseId:guid}/{propertyType}")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> GenerateTagNumber(Guid warehouseId, PropertyType propertyType, CancellationToken cancellationToken)
    {
        var tagNumber = await workflowService.GenerateTagNumber(warehouseId, propertyType, cancellationToken);
        return Ok(new { tagNumber });
    }
}
