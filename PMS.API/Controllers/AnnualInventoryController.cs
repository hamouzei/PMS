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
[Route("api/annual-inventory")]
[Authorize(Roles = PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class AnnualInventoryController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int? fiscalYear,
        [FromQuery] string? location,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.AnnualInventories.AsNoTracking()
            .Include(v => v.CountedBy).AsQueryable();

        if (fiscalYear.HasValue) query = query.Where(v => v.FiscalYear == fiscalYear.Value);
        if (!string.IsNullOrWhiteSpace(location)) query = query.Where(v => v.Location == location);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.FiscalYear)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.InventoryNumber, v.FiscalYear, v.Location, v.Status, v.CountDate,
                CountedBy = v.CountedBy != null ? v.CountedBy.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var inventory = await context.AnnualInventories.AsNoTracking()
            .Include(v => v.Lines).ThenInclude(l => l.Item)
            .Include(v => v.CountedBy)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);
        return inventory is null ? NotFound() : Ok(inventory);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAnnualInventoryRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateAnnualInventoryCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CompleteAnnualInventoryCommand(id, request), cancellationToken));
    }
}
