using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/disposal")]
[Authorize(Roles = PasRoles.ComplianceOfficer + "," + PasRoles.StockActors)]
public class DisposalController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.DisposalRecords
            .AsNoTracking()
            .Include(value => value.Item)
            .Include(value => value.Custodian)
            .OrderByDescending(value => value.CreatedDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDisposalRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreateDisposal(request, cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.ApproveDisposal(id, request, cancellationToken));
    }
}
