using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/purchase-requests")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.ProcurementOfficer)]
public class PurchaseRequestsController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.PurchaseRequests
            .AsNoTracking()
            .Include(value => value.Details)
            .OrderByDescending(value => value.RequestDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePurchaseRequestRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreatePurchaseRequest(request, cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers + "," + PasRoles.ProcurementOfficer)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.ApprovePurchaseRequest(id, request, cancellationToken));
    }
}
