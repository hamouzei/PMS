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
/// FR0015: Property Handover Management — manages handover of property
/// between staff/locations (HO/Branch), with approval workflow.
/// </summary>
[ApiController]
[Route("api/handovers")]
[Authorize]
public class HandoverController(IMediator mediator, PMSDbContext context) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = PasRoles.HandoverActors)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyHandovers
            .Include(h => h.HandoverFrom)
            .Include(h => h.HandoverTo)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<Domain.Enums.WorkflowStatus>(status, true, out var parsedStatus))
            query = query.Where(h => h.Status == parsedStatus);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(h => h.CreatedDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(
            items.Select(h => new
            {
                h.Id, h.HandoverNumber, h.Status, h.HandoverDate, h.Purpose,
                h.FromLocation, h.ToLocation,
                HandoverFrom = h.HandoverFrom?.FullName,
                HandoverTo = h.HandoverTo?.FullName
            }).ToList(),
            pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = PasRoles.HandoverActors)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var handover = await context.PropertyHandovers
            .Include(h => h.Details).ThenInclude(d => d.Item)
            .Include(h => h.HandoverFrom)
            .Include(h => h.HandoverTo)
            .Include(h => h.AuthorizedBy)
            .SingleOrDefaultAsync(h => h.Id == id, cancellationToken);

        return handover is null ? NotFound() : Ok(handover);
    }

    [HttpPost]
    [Authorize(Roles = PasRoles.HandoverActors)]
    public async Task<IActionResult> Create(CreateHandoverRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateHandoverCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveHandoverCommand(id, request), cancellationToken));
    }
}
