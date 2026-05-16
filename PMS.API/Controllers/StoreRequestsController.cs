using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/store-requests")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class StoreRequestsController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.ServiceRequests
            .AsNoTracking()
            .Include(value => value.Requester)
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.RequestDate)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var request = await context.ServiceRequests
            .AsNoTracking()
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .SingleOrDefaultAsync(value => value.Id == id, cancellationToken);

        return request is null ? NotFound() : Ok(request);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateStoreRequestRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreateStoreRequest(request, cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.ApproveStoreRequest(id, request, cancellationToken));
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = PasRoles.Approvers)]
    public async Task<IActionResult> Reject(Guid id, RejectRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.RejectStoreRequest(id, request, cancellationToken));
    }
}
