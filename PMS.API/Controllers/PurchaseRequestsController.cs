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
[Route("api/purchase-requests")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.ProcurementOfficer)]
public class PurchaseRequestsController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? requesterId = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.PurchaseRequests
            .AsNoTracking()
            .Include(value => value.Details)
            .Include(value => value.Requester)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<Domain.Enums.WorkflowStatus>(status, true, out var parsed))
            query = query.Where(v => v.Status == parsed);
        if (requesterId.HasValue)
            query = query.Where(v => v.RequesterId == requesterId.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(value => value.RequestDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(
            items.Select(pr => new
            {
                pr.Id, pr.PrNumber, pr.Status, pr.RequestDate,
                pr.RequestType, pr.Justification, pr.EstimatedBudget,
                pr.RejectionReason,
                Requester = pr.Requester?.FullName,
                DetailCount = pr.Details.Count
            }).ToList(),
            pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var pr = await context.PurchaseRequests
            .AsNoTracking()
            .Include(value => value.Details).ThenInclude(d => d.Item)
            .Include(value => value.Requester)
            .Include(value => value.ApprovedBy)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);

        return pr is null ? NotFound() : Ok(pr);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePurchaseRequestRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreatePurchaseRequestCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApprovePurchaseRequestCommand(id, request), cancellationToken));
    }

    /// <summary>SR006: Reject purchase request (was MISSING)</summary>
    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = PasRoles.Approvers + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> Reject(Guid id, RejectRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new RejectPurchaseRequestCommand(id, request), cancellationToken));
    }
}
