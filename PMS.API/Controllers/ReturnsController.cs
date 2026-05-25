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
[Route("api/returns")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class ReturnsController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyReturns.AsNoTracking()
            .Include(v => v.ReturnedBy).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, true, out var parsed))
            query = query.Where(v => v.Status == parsed);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.ReturnDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.RmrnNumber, v.Status, v.ReturnDate, v.Reason,
                ReturnedBy = v.ReturnedBy != null ? v.ReturnedBy.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ret = await context.PropertyReturns.AsNoTracking()
            .Include(v => v.Details).ThenInclude(d => d.Item)
            .Include(v => v.ReturnedBy).Include(v => v.ReceivedBy).Include(v => v.AuthorizedBy)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);
        return ret is null ? NotFound() : Ok(ret);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReturnRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateReturnCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.StockActors + "," + PasRoles.Approvers)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveReturnCommand(id, request), cancellationToken));
    }
}
