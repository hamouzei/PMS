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
[Route("api/transfers")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class TransfersController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.PropertyTransfers.AsNoTracking()
            .Include(v => v.FromCustodian).Include(v => v.ToCustodian).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, true, out var parsed))
            query = query.Where(v => v.Status == parsed);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.TransferDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.RmtnNumber, v.Status, v.TransferDate, v.Reason,
                FromCustodian = v.FromCustodian != null ? v.FromCustodian.FullName : "",
                ToCustodian = v.ToCustodian != null ? v.ToCustodian.FullName : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var transfer = await context.PropertyTransfers.AsNoTracking()
            .Include(v => v.Details).ThenInclude(d => d.Item)
            .Include(v => v.FromCustodian).Include(v => v.ToCustodian).Include(v => v.AuthorizedBy)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);
        return transfer is null ? NotFound() : Ok(transfer);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTransferRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateTransferCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers + "," + PasRoles.StockActors)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveTransferCommand(id, request), cancellationToken));
    }
}
