using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/transfers")]
[Authorize(Roles = PasRoles.RequestActors + "," + PasRoles.StockActors)]
public class TransfersController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.PropertyTransfers
            .AsNoTracking()
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.TransferDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTransferRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreateTransfer(request, cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = PasRoles.Approvers + "," + PasRoles.StockActors)]
    public async Task<IActionResult> Approve(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.ApproveTransfer(id, request, cancellationToken));
    }
}
