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
    public async Task<IActionResult> GetVouchers(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.StoreIssueVouchers.AsNoTracking()
            .Include(v => v.IssuedBy).Include(v => v.ServiceRequest).AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.IssueDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.SivNumber, v.FaivNumber, v.Status, v.IssueDate,
                VoucherType = v.VoucherType.ToString(),
                IssuedBy = v.IssuedBy != null ? v.IssuedBy.FullName : "",
                SrNumber = v.ServiceRequest != null ? v.ServiceRequest.SrNumber : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpGet("vouchers/{id:guid}")]
    public async Task<IActionResult> GetVoucherById(Guid id, CancellationToken cancellationToken)
    {
        var voucher = await context.StoreIssueVouchers.AsNoTracking()
            .Include(v => v.Details).ThenInclude(d => d.Item)
            .Include(v => v.IssuedBy).Include(v => v.ServiceRequest)
            .SingleOrDefaultAsync(v => v.Id == id, cancellationToken);
        return voucher is null ? NotFound() : Ok(voucher);
    }

    [HttpPost]
    public async Task<IActionResult> Issue(IssueStockRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new IssueStockCommand(request), cancellationToken));
    }
}
