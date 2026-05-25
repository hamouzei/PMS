using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.DTO;
using PMS.Domain.Enums;
using PMS.Persistence;

namespace PMS.API.Controllers;

/// <summary>
/// FR0019: Reports — dashboard KPIs, individual document reports,
/// stock summary, movements, audit trail, and user-filtered notifications.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize(Roles = PasRoles.ReportActors)]
public class ReportsController(PMSDbContext context) : ControllerBase
{
    /// <summary>SR001: Dashboard KPIs with all pending workflow counts.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        return Ok(new
        {
            stockItems = await context.InventoryStocks.CountAsync(cancellationToken),
            lowStock = await context.InventoryStocks.CountAsync(
                v => v.Item != null && v.CurrentQuantity - v.ReservedQuantity <= v.Item.MinStockLevel, cancellationToken),
            pendingStoreRequests = await context.ServiceRequests
                .CountAsync(v => v.Status == WorkflowStatus.PendingApproval, cancellationToken),
            pendingPurchaseRequests = await context.PurchaseRequests
                .CountAsync(v => v.Status == WorkflowStatus.PendingApproval, cancellationToken),
            pendingReceiving = await context.ReceivingNotes
                .CountAsync(v => v.Status == WorkflowStatus.InspectionPending, cancellationToken),
            pendingReturns = await context.PropertyReturns
                .CountAsync(v => v.Status == WorkflowStatus.Submitted, cancellationToken),
            pendingTransfers = await context.PropertyTransfers
                .CountAsync(v => v.Status == WorkflowStatus.Submitted, cancellationToken),
            pendingHandovers = await context.PropertyHandovers
                .CountAsync(v => v.Status == WorkflowStatus.PendingApproval, cancellationToken),
            pendingDisposals = await context.DisposalRecords
                .CountAsync(v => v.Status == WorkflowStatus.Submitted, cancellationToken),
            pendingInspections = await context.ReceivingNotes
                .CountAsync(v => v.Status == WorkflowStatus.InspectionPending, cancellationToken)
        });
    }

    /// <summary>FR0019: Stock Summary Report — aggregated by item.</summary>
    [HttpGet("stock-summary")]
    public async Task<IActionResult> StockSummary(CancellationToken cancellationToken)
    {
        var rows = await context.InventoryStocks
            .AsNoTracking()
            .Include(v => v.Item)
            .GroupBy(v => new { v.ItemId, v.Item!.Sku, v.Item.ItemName, v.Item.UnitOfMeasure, v.Item.MinStockLevel })
            .Select(g => new
            {
                g.Key.ItemId, g.Key.Sku, g.Key.ItemName, g.Key.UnitOfMeasure,
                currentQuantity = g.Sum(v => v.CurrentQuantity),
                reservedQuantity = g.Sum(v => v.ReservedQuantity),
                availableQuantity = g.Sum(v => v.CurrentQuantity - v.ReservedQuantity),
                g.Key.MinStockLevel
            })
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    /// <summary>FR0019: Property Movement Report — with date range filtering.</summary>
    [HttpGet("movements")]
    public async Task<IActionResult> Movements(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? itemId,
        [FromQuery] string? transactionType,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.StockLedgers.AsNoTracking().Include(v => v.Item).AsQueryable();

        if (from.HasValue) query = query.Where(v => v.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(v => v.TransactionDate <= to.Value);
        if (itemId.HasValue) query = query.Where(v => v.ItemId == itemId.Value);
        if (!string.IsNullOrWhiteSpace(transactionType) && Enum.TryParse<StockTransactionType>(transactionType, true, out var tt))
            query = query.Where(v => v.TransactionType == tt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.TransactionDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, ItemName = v.Item != null ? v.Item.ItemName : "", v.ReferenceNumber,
                TransactionType = v.TransactionType.ToString(), v.QuantityChange, v.BalanceAfter,
                v.UnitCost, v.Reason, v.TransactionDate
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    /// <summary>FR0019: Audit Trail Report — with date/entity filtering.</summary>
    [HttpGet("audit")]
    public async Task<IActionResult> Audit(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? entityName,
        [FromQuery] Guid? userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.AuditTrails.AsNoTracking().Include(v => v.User).AsQueryable();

        if (from.HasValue) query = query.Where(v => v.ActionDate >= from.Value);
        if (to.HasValue) query = query.Where(v => v.ActionDate <= to.Value);
        if (!string.IsNullOrWhiteSpace(entityName)) query = query.Where(v => v.EntityName == entityName);
        if (userId.HasValue) query = query.Where(v => v.UserId == userId.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.ActionDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.Action, v.EntityName, v.EntityId, v.Details, v.ActionDate,
                UserName = v.User != null ? v.User.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    /// <summary>SR001: User-filtered notifications endpoint.</summary>
    [HttpGet("notifications")]
    [Authorize]
    public async Task<IActionResult> Notifications(
        [FromQuery] Guid? userId,
        [FromQuery] string? role,
        [FromQuery] bool? unreadOnly,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.NotificationEvents.AsNoTracking().AsQueryable();

        if (userId.HasValue) query = query.Where(v => v.RecipientId == userId.Value || v.RecipientId == null);
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            query = query.Where(v => v.RecipientRole == parsedRole || v.RecipientRole == null);
        if (unreadOnly == true) query = query.Where(v => !v.IsRead);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.CreatedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    /// <summary>Mark notification as read.</summary>
    [HttpPost("notifications/{id:guid}/read")]
    [Authorize]
    public async Task<IActionResult> MarkNotificationRead(Guid id, CancellationToken cancellationToken)
    {
        var notification = await context.NotificationEvents.FindAsync([id], cancellationToken);
        if (notification is null) return NotFound();
        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return Ok(notification);
    }

    // ── FR0019: Individual Document Reports ──────────────────────────────────

    /// <summary>FR0019: Goods Receiving Report (GRN).</summary>
    [HttpGet("receiving")]
    public async Task<IActionResult> ReceivingReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.ReceivingNotes.AsNoTracking()
            .Include(r => r.Supplier).Include(r => r.Warehouse).Include(r => r.ReceivedBy)
            .Where(r => r.FarnNumber == null) // consumable GRNs only
            .AsQueryable();
        if (from.HasValue) query = query.Where(r => r.ReceivedDate >= from.Value);
        if (to.HasValue) query = query.Where(r => r.ReceivedDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(r => r.ReceivedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(r => new { r.Id, r.GrnNumber, r.Status, r.ReceivedDate, r.InvoiceNumber,
                Supplier = r.Supplier != null ? r.Supplier.SupplierName : "",
                Warehouse = r.Warehouse != null ? r.Warehouse.WarehouseName : "",
                ReceivedBy = r.ReceivedBy != null ? r.ReceivedBy.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Fixed Assets Receiving Report (FARN).</summary>
    [HttpGet("fixed-assets-receiving")]
    public async Task<IActionResult> FixedAssetsReceivingReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.ReceivingNotes.AsNoTracking()
            .Include(r => r.Supplier).Include(r => r.ReceivedBy)
            .Where(r => r.FarnNumber != null).AsQueryable();
        if (from.HasValue) query = query.Where(r => r.ReceivedDate >= from.Value);
        if (to.HasValue) query = query.Where(r => r.ReceivedDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(r => r.ReceivedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(r => new { r.Id, r.GrnNumber, r.FarnNumber, r.Status, r.ReceivedDate,
                Supplier = r.Supplier != null ? r.Supplier.SupplierName : "",
                ReceivedBy = r.ReceivedBy != null ? r.ReceivedBy.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Goods Issuing Report (SIV).</summary>
    [HttpGet("issuing")]
    public async Task<IActionResult> IssuingReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.StoreIssueVouchers.AsNoTracking()
            .Include(v => v.IssuedBy).Include(v => v.ServiceRequest)
            .Where(v => v.FaivNumber == null).AsQueryable();
        if (from.HasValue) query = query.Where(v => v.IssueDate >= from.Value);
        if (to.HasValue) query = query.Where(v => v.IssueDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.IssueDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new { v.Id, v.SivNumber, v.Status, v.IssueDate,
                IssuedBy = v.IssuedBy != null ? v.IssuedBy.FullName : "",
                SrNumber = v.ServiceRequest != null ? v.ServiceRequest.SrNumber : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Fixed Assets Issuing Report (FAIV).</summary>
    [HttpGet("fixed-assets-issuing")]
    public async Task<IActionResult> FixedAssetsIssuingReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.StoreIssueVouchers.AsNoTracking()
            .Include(v => v.IssuedBy)
            .Where(v => v.FaivNumber != null).AsQueryable();
        if (from.HasValue) query = query.Where(v => v.IssueDate >= from.Value);
        if (to.HasValue) query = query.Where(v => v.IssueDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.IssueDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new { v.Id, v.SivNumber, v.FaivNumber, v.Status, v.IssueDate,
                IssuedBy = v.IssuedBy != null ? v.IssuedBy.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Return Material Receiving Report (RMRN).</summary>
    [HttpGet("returns")]
    public async Task<IActionResult> ReturnsReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyReturns.AsNoTracking()
            .Include(r => r.ReturnedBy).AsQueryable();
        if (from.HasValue) query = query.Where(r => r.ReturnDate >= from.Value);
        if (to.HasValue) query = query.Where(r => r.ReturnDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(r => r.ReturnDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(r => new { r.Id, r.RmrnNumber, r.Status, r.ReturnDate, r.Reason,
                ReturnedBy = r.ReturnedBy != null ? r.ReturnedBy.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Return Material Transfer Report (RMTN).</summary>
    [HttpGet("transfers")]
    public async Task<IActionResult> TransfersReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyTransfers.AsNoTracking()
            .Include(t => t.FromCustodian).Include(t => t.ToCustodian).AsQueryable();
        if (from.HasValue) query = query.Where(t => t.TransferDate >= from.Value);
        if (to.HasValue) query = query.Where(t => t.TransferDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(t => t.TransferDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(t => new { t.Id, t.RmtnNumber, t.Status, t.TransferDate, t.Reason,
                FromCustodian = t.FromCustodian != null ? t.FromCustodian.FullName : "",
                ToCustodian = t.ToCustodian != null ? t.ToCustodian.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Purchase Requisition Report.</summary>
    [HttpGet("purchase-requests")]
    public async Task<IActionResult> PurchaseRequestsReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.PurchaseRequests.AsNoTracking()
            .Include(p => p.Requester).AsQueryable();
        if (from.HasValue) query = query.Where(p => p.RequestDate >= from.Value);
        if (to.HasValue) query = query.Where(p => p.RequestDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(p => p.RequestDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(p => new { p.Id, p.PrNumber, p.Status, p.RequestDate, p.RequestType,
                p.Justification, p.EstimatedBudget,
                Requester = p.Requester != null ? p.Requester.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Inspection Report.</summary>
    [HttpGet("inspections")]
    public async Task<IActionResult> InspectionsReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.InspectionLogs.AsNoTracking()
            .Include(i => i.Inspector).Include(i => i.ReceivingNote).AsQueryable();
        if (from.HasValue) query = query.Where(i => i.InspectionDate >= from.Value);
        if (to.HasValue) query = query.Where(i => i.InspectionDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(i => i.InspectionDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(i => new { i.Id, i.IsPassed, i.DeviationNotes, i.InspectionDate,
                Inspector = i.Inspector != null ? i.Inspector.FullName : "",
                GrnNumber = i.ReceivingNote != null ? i.ReceivingNote.GrnNumber : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: UC Report (Fixed Assets Registry per custodian).</summary>
    [HttpGet("custody")]
    public async Task<IActionResult> CustodyReport(
        [FromQuery] Guid? custodianId,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.UserCustodies.AsNoTracking()
            .Include(c => c.Custodian).Include(c => c.Item)
            .Where(c => c.Quantity > 0).AsQueryable();
        if (custodianId.HasValue) query = query.Where(c => c.CustodianId == custodianId.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(c => c.Custodian!.FullName)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(c => new { c.Id, c.Quantity, c.TagNumber, c.SerialNumber, c.SourceDocumentNumber,
                Custodian = c.Custodian != null ? c.Custodian.FullName : "",
                ItemName = c.Item != null ? c.Item.ItemName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Disposal Report.</summary>
    [HttpGet("disposals")]
    public async Task<IActionResult> DisposalsReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.DisposalRecords.AsNoTracking()
            .Include(d => d.Item).Include(d => d.Custodian).AsQueryable();
        if (from.HasValue) query = query.Where(d => d.CreatedDate >= from.Value);
        if (to.HasValue) query = query.Where(d => d.CreatedDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(d => d.CreatedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(d => new { d.Id, d.DisposalNumber, d.Quantity, d.Status,
                Condition = d.Condition.ToString(), DisposalMethod = d.DisposalMethod.ToString(),
                ItemName = d.Item != null ? d.Item.ItemName : "",
                Custodian = d.Custodian != null ? d.Custodian.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Handover Report.</summary>
    [HttpGet("handovers")]
    public async Task<IActionResult> HandoversReport(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyHandovers.AsNoTracking()
            .Include(h => h.HandoverFrom).Include(h => h.HandoverTo).AsQueryable();
        if (from.HasValue) query = query.Where(h => h.HandoverDate >= from.Value);
        if (to.HasValue) query = query.Where(h => h.HandoverDate <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(h => h.HandoverDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(h => new { h.Id, h.HandoverNumber, h.Status, h.HandoverDate, h.Purpose,
                h.FromLocation, h.ToLocation,
                HandoverFrom = h.HandoverFrom != null ? h.HandoverFrom.FullName : "",
                HandoverTo = h.HandoverTo != null ? h.HandoverTo.FullName : "" })
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, total));
    }

    /// <summary>FR0019: Budget Utilization Report.</summary>
    [HttpGet("budget-utilization")]
    public async Task<IActionResult> BudgetUtilization(
        [FromQuery] int? fiscalYear,
        CancellationToken cancellationToken = default)
    {
        var query = context.BudgetAllocations.AsNoTracking().AsQueryable();
        if (fiscalYear.HasValue) query = query.Where(b => b.FiscalYear == fiscalYear.Value);

        return Ok(await query.OrderBy(b => b.Department)
            .Select(b => new { b.Id, b.FiscalYear, b.Department, b.Division,
                b.AllocatedAmount, b.UtilizedAmount, RemainingAmount = b.AllocatedAmount - b.UtilizedAmount })
            .ToListAsync(cancellationToken));
    }

    /// <summary>FR0020: Annual Inventory Report with year-over-year comparison.</summary>
    [HttpGet("annual-inventory")]
    public async Task<IActionResult> AnnualInventoryReport(
        [FromQuery] int? fiscalYear,
        [FromQuery] string? location,
        CancellationToken cancellationToken = default)
    {
        var query = context.AnnualInventories.AsNoTracking()
            .Include(a => a.Lines).ThenInclude(l => l.Item)
            .Include(a => a.CountedBy)
            .AsQueryable();

        if (fiscalYear.HasValue) query = query.Where(a => a.FiscalYear == fiscalYear.Value);
        if (!string.IsNullOrWhiteSpace(location)) query = query.Where(a => a.Location == location);

        var inventories = await query.OrderByDescending(a => a.FiscalYear).ToListAsync(cancellationToken);

        var report = inventories.Select(a => new
        {
            a.Id, a.InventoryNumber, a.FiscalYear, a.Location, a.Status, a.CountDate,
            CountedBy = a.CountedBy?.FullName,
            TotalItems = a.Lines.Count,
            TotalExpected = a.Lines.Sum(l => l.ExpectedQuantity),
            TotalCounted = a.Lines.Sum(l => l.CountedQuantity),
            TotalDiscrepancy = a.Lines.Sum(l => l.Discrepancy),
            HasDiscrepancies = a.Lines.Any(l => l.Discrepancy != 0)
        });

        return Ok(report);
    }
}
