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
[Route("api/issuing")]
[Authorize(Roles = PasRoles.StockActors)]
public class IssuingController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet("vouchers")]
    public async Task<IActionResult> GetVouchers(CancellationToken cancellationToken)
    {
        return Ok(await context.StoreIssueVouchers
            .AsNoTracking()
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.IssueDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Issue(IssueStockRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new IssueStockCommand(request), cancellationToken));
    }
}
