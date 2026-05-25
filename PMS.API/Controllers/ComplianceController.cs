using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Persistence;

namespace PMS.API.Controllers;

/// <summary>
/// FR0016: Compliance Management — internal compliance reviews,
/// findings, recommendations, and corrective actions.
/// </summary>
[ApiController]
[Route("api/compliance")]
[Authorize(Roles = PasRoles.ComplianceActors)]
public class ComplianceController(IMediator mediator, PMSDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var totalCount = await context.ComplianceRecords.CountAsync(cancellationToken);
        var items = await context.ComplianceRecords
            .Include(c => c.ReviewedBy)
            .Include(c => c.Inventory)
            .OrderByDescending(c => c.ReviewDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<object>(
            items.Select(c => new
            {
                c.Id, c.ComplianceNumber, c.Status, c.ReviewDate,
                c.Findings, c.Recommendations, c.CorrectiveActions,
                ReviewedBy = c.ReviewedBy?.FullName,
                InventoryNumber = c.Inventory?.InventoryNumber
            }).ToList(),
            pageNumber, pageSize, totalCount));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var record = await context.ComplianceRecords
            .Include(c => c.ReviewedBy)
            .Include(c => c.Inventory)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateComplianceRecordRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new CreateComplianceCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, ApproveRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CloseComplianceCommand(id, request), cancellationToken));
    }
}
