using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.Contracts.Services;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/receiving")]
[Authorize(Roles = PasRoles.StockActors)]
public class ReceivingController(PMSDbContext context, IPasWorkflowService workflowService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await context.ReceivingNotes
            .AsNoTracking()
            .Include(value => value.Supplier)
            .Include(value => value.Details)
            .ThenInclude(value => value.Item)
            .OrderByDescending(value => value.ReceivedDate)
            .ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateReceivingNoteRequest request, CancellationToken cancellationToken)
    {
        return Ok(await workflowService.CreateReceivingNote(request, cancellationToken));
    }

    [HttpPost("{id:guid}/release-to-stock")]
    public async Task<IActionResult> Release(Guid id, ReleaseReceivingRequest request, CancellationToken cancellationToken)
    {
        var releaseRequest = request with { ReceivingNoteId = id };
        return Ok(await workflowService.ReleaseReceivingToStock(releaseRequest, cancellationToken));
    }
}
