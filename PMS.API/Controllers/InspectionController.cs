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
[Route("api/inspection")]
[Authorize(Roles = PasRoles.Inspector + "," + PasRoles.StockActors)]
public class InspectionController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = context.InspectionLogs.AsNoTracking()
            .Include(v => v.ReceivingNote)
            .Include(v => v.Inspector)
            .AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(v => v.InspectionDate)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(v => new
            {
                v.Id, v.IsPassed, v.DeviationNotes, v.InspectionDate,
                Inspector = v.Inspector != null ? v.Inspector.FullName : "",
                GrnNumber = v.ReceivingNote != null ? v.ReceivingNote.GrnNumber : ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(items.Cast<object>().ToList(), pageNumber, pageSize, totalCount));
    }

    [HttpPost]
    public async Task<IActionResult> Record(RecordInspectionRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new RecordInspectionCommand(request), cancellationToken));
    }
}
