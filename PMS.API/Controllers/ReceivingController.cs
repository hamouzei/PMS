using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediatR;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Domain.Enums;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/receiving")]
[Authorize(Roles = PasRoles.StockActors)]
public class ReceivingController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.ReceivingNotes.AsNoTracking()
            .Include(v => v.Supplier)
            .Include(v => v.ReceivedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, true, out var parsed))
            query = query.Where(v => v.Status == parsed);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(v => v.ReceivedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.GrnNumber, v.FarnNumber, v.Status, v.ReceivedDate, v.InvoiceNumber,
                Supplier = v.Supplier != null ? v.Supplier.SupplierName : "",
                ReceivedBy = v.ReceivedBy != null ? v.ReceivedBy.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var note = await context.ReceivingNotes.AsNoTracking()
            .Include(v => v.Supplier)
            .Include(v => v.Details).ThenInclude(d => d.Item)
            .Include(v => v.InspectionLog).ThenInclude(i => i!.Inspector)
            .Include(v => v.ReceivedBy)
            .Include(v => v.ApprovedBy)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);

        return note is null ? NotFound() : Ok(note);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReceivingNoteRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateReceivingNoteCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>SR0011: Record inspection result.</summary>
    [HttpPost("{id:guid}/inspect")]
    [Authorize(Roles = PasRoles.StockActors + "," + PasRoles.Inspector)]
    public async Task<IActionResult> Inspect(Guid id, RecordInspectionRequest request, CancellationToken cancellationToken)
    {
        var inspectionRequest = request with { ReceivingNoteId = id };
        return Ok(await mediator.Send(new RecordInspectionCommand(inspectionRequest), cancellationToken));
    }

    [HttpPost("{id:guid}/release-to-stock")]
    public async Task<IActionResult> Release(Guid id, ReleaseReceivingRequest request, CancellationToken cancellationToken)
    {
        var releaseRequest = request with { ReceivingNoteId = id };
        return Ok(await mediator.Send(new ReleaseReceivingCommand(releaseRequest), cancellationToken));
    }
}
