using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/annual-inventory")]
[Authorize(Roles = PasRoles.StockActors + "," + PasRoles.ReportActors)]
public class AnnualInventoryController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.AnnualInventories
            .AsNoTracking()
            .Include(value => value.Lines)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.FiscalYear)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAnnualInventoryRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreateAnnualInventory(request, cancellationToken));
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CompleteAnnualInventory(id, request, cancellationToken));
    }
}
