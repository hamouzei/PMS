using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/custody")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class CustodyController(PMSDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? custodianId, CancellationToken cancellationToken)
    {
        var query = context.UserCustodies
            .AsNoTracking()
            .Include(value => value.Custodian)
            .Include(value => value.Item)
            .AsQueryable();

        if (custodianId.HasValue)
        {
            query = query.Where(value => value.CustodianId == custodianId.Value);
        }

        return Ok(await query.OrderBy(value => value.Custodian!.FullName).ToListAsync(cancellationToken));
    }
}
