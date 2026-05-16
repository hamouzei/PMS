using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/stock")]
[Authorize(Roles = PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class StockController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet("balances")]
    public async Task<IActionResult> GetBalances(CancellationToken cancellationToken)
    {
        return Ok(await context.InventoryStocks
            .AsNoTracking()
            .Include(value => value.Item)
            .Include(value => value.Shelf)
            .ThenInclude(value => value!.Warehouse)
            .OrderBy(value => value.Item!.ItemName)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("availability/{itemId:guid}")]
    public async Task<IActionResult> GetAvailability(Guid itemId, CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks
            .AsNoTracking()
            .Where(value => value.ItemId == itemId)
            .Include(value => value.Shelf)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            itemId,
            currentQuantity = rows.Sum(value => value.CurrentQuantity),
            reservedQuantity = rows.Sum(value => value.ReservedQuantity),
            availableQuantity = rows.Sum(value => value.AvailableQuantity),
            shelves = rows
        });
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks
            .AsNoTracking()
            .Include(value => value.Item)
            .Include(value => value.Shelf)
            .Where(value => value.Item != null && value.CurrentQuantity - value.ReservedQuantity <= value.Item.MinStockLevel)
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("ledger")]
    public async Task<IActionResult> GetLedger([FromQuery] Guid? itemId, CancellationToken cancellationToken)
    {
        var query = context.StockLedgers.AsNoTracking().Include(value => value.Item).Include(value => value.Shelf).AsQueryable();
        if (itemId.HasValue)
        {
            query = query.Where(value => value.ItemId == itemId.Value);
        }

        return Ok(await query.OrderByDescending(value => value.TransactionDate).Take(500).ToListAsync(cancellationToken));
    }

    [HttpPost("opening-balance")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> RegisterOpeningBalance(RegisterOpeningBalanceRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.RegisterOpeningBalance(request, cancellationToken));
    }

    [HttpPost("adjustments")]
    [Authorize(Roles = PasRoles.StockActors)]
    public async Task<IActionResult> AdjustStock(StockAdjustmentRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.AdjustStock(request, cancellationToken));
    }
}
