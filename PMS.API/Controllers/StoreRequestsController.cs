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
[Route("api/store-requests")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class StoreRequestsController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? requesterId = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.ServiceRequests
            .AsNoTracking()
            .Include(value => value.Requester)
            .Include(value => value.Details).ThenInclude(d => d.Item)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, true, out var parsed))
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
            items.Select(sr => new
            {
                sr.Id, sr.SrNumber, sr.Status, sr.RequestDate, sr.RequestType, sr.Reason,
                Requester = sr.Requester?.FullName,
                DetailCount = sr.Details.Count
            }).ToList(),
            pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var request = await context.ServiceRequests
            .AsNoTracking()
            .Include(value => value.Details).ThenInclude(d => d.Item)
            .Include(value => value.Requester)
            .Include(value => value.ApprovedBy)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);

        return request is null ? NotFound() : Ok(request);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStoreRequestRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateStoreRequestCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveStoreRequestCommand(id, request), cancellationToken));
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = PasRoles.Approvers)]
    public async Task<IActionResult> Reject(Guid id, RejectRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new RejectStoreRequestCommand(id, request), cancellationToken));
    }
}
