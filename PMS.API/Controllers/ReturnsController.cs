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
[Route("api/returns")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class ReturnsController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.PropertyReturns
            .AsNoTracking()
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.ReturnDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReturnRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateReturnCommand(request), cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.StockActors + "," + PasRoles.Approvers)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new ApproveReturnCommand(id, request), cancellationToken));
    }
}
