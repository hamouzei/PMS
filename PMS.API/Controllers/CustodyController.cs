using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/custody")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class CustodyController(PMSDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] Guid? custodianId,
        [FromQuery] Guid? itemId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = context.UserCustodies.AsNoTracking()
            .Include(v => v.Custodian).Include(v => v.Item)
            .Where(v => v.Quantity > 0)
            .AsQueryable();

        if (custodianId.HasValue) query = query.Where(v => v.CustodianId == custodianId.Value);
        if (itemId.HasValue) query = query.Where(v => v.ItemId == itemId.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(v => v.Custodian!.FullName)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.Quantity, v.TagNumber, v.SerialNumber, v.SourceDocumentNumber,
                Custodian = v.Custodian != null ? v.Custodian.FullName : "",
                CustodianId = v.CustodianId,
                ItemName = v.Item != null ? v.Item.ItemName : "",
                ItemId = v.ItemId
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }
}
