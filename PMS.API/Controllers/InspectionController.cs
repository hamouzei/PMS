using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/inspection")]
[Authorize(Roles = PasRoles.Inspector + "," + PasRoles.StockActors)]
public class InspectionController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.InspectionLogs
            .AsNoTracking()
            .Include(value => value.ReceivingNote)
            .OrderByDescending(value => value.InspectionDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Record(RecordInspectionRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.RecordInspection(request, cancellationToken));
    }
}
