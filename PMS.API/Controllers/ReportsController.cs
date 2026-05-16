using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = PasRoles.ReportActors)]
public class ReportsController(PMSDbContext context) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var stockItems = await context.InventoryStocks.CountAsync(cancellationToken);
        var lowStock = await context.InventoryStocks.CountAsync(
            value => value.Item != null && value.CurrentQuantity - value.ReservedQuantity <= value.Item.MinStockLevel,
            cancellationToken);

        return Ok(new
        {
            stockItems,
            lowStock,
            pendingStoreRequests = await context.ServiceRequests.CountAsync(value => value.Status == Domain.Enums.WorkflowStatus.PendingApproval, cancellationToken),
            pendingReceiving = await context.ReceivingNotes.CountAsync(value => value.Status == Domain.Enums.WorkflowStatus.InspectionPending, cancellationToken),
            pendingReturns = await context.PropertyReturns.CountAsync(value => value.Status == Domain.Enums.WorkflowStatus.Submitted, cancellationToken),
            pendingDisposals = await context.DisposalRecords.CountAsync(value => value.Status == Domain.Enums.WorkflowStatus.Submitted, cancellationToken)
        });
    }

    [HttpGet("stock-summary")]
    public async Task<IActionResult> StockSummary(CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks
            .AsNoTracking()
            .Include(value => value.Item)
            .GroupBy(value => new
            {
                value.ItemId,
                value.Item!.Sku,
                value.Item.ItemName,
                value.Item.UnitOfMeasure,
                value.Item.MinStockLevel
            })
            .Select(group => new
            {
                group.Key.ItemId,
                group.Key.Sku,
                group.Key.ItemName,
                group.Key.UnitOfMeasure,
                currentQuantity = group.Sum(value => value.CurrentQuantity),
                reservedQuantity = group.Sum(value => value.ReservedQuantity),
                availableQuantity = group.Sum(value => value.CurrentQuantity - value.ReservedQuantity),
                group.Key.MinStockLevel
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("movements")]
    public async Task<IActionResult> Movements(CancellationToken cancellationToken)
    {
        return Ok(await context.StockLedgers
            .AsNoTracking()
            .Include(value => value.Item)
            .OrderByDescending(value => value.TransactionDate)
            .Take(1000)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("audit")]
    public async Task<IActionResult> Audit(CancellationToken cancellationToken)
    {
        return Ok(await context.AuditTrails
            .AsNoTracking()
            .OrderByDescending(value => value.ActionDate)
            .Take(1000)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications(CancellationToken cancellationToken)
    {
        return Ok(await context.NotificationEvents
            .AsNoTracking()
            .OrderByDescending(value => value.CreatedDate)
            .Take(500)
            .ToListAsync(cancellationToken));
    }
}
