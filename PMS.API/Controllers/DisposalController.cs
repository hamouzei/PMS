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
[Route("api/disposal")]
[Authorize(Roles = PasRoles.ComplianceOfficer + "," + PasRoles.StockActors)]
public class DisposalController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.DisposalRecords.AsNoTracking()
            .Include(v => v.Item).Include(v => v.Custodian).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, true, out var parsed))
            query = query.Where(v => v.Status == parsed);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.CreatedDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.DisposalNumber, v.Quantity, v.Status,
                Condition = v.Condition.ToString(), DisposalMethod = v.DisposalMethod.ToString(),
                ItemName = v.Item != null ? v.Item.ItemName : "",
                Custodian = v.Custodian != null ? v.Custodian.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var disposal = await context.DisposalRecords.AsNoTracking()
            .Include(v => v.Item).Include(v => v.Custodian).Include(v => v.ApprovedBy)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);
        return disposal is null ? NotFound() : Ok(disposal);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDisposalRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateDisposalCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveDisposalCommand(id, request), cancellationToken));
    }
}
