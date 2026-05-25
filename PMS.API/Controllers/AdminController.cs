using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMS.API.Authorization;
using PMS.Application.CQRS;
using PMS.Application.DTO;
using PMS.Persistence;
using PMS.Persistence.Services;

namespace PMS.API.Controllers;

/// <summary>
/// SR002: Admin Module — user management, system configuration, budget allocation.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = PasRoles.PropertyAdmin)]
public class AdminController(PMSDbContext context, IMediator mediator) : ControllerBase
{
    [HttpPost("seed")]
    public async Task<IActionResult> Seed(CancellationToken cancellationToken)
    {
        await PasSeedData.SeedAsync(context, cancellationToken);
        return Ok(new { message = "Seed data is ready." });
    }

    /// <summary>SR002: Update user details (role, department, active status).</summary>
    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateUserCommand(id, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>SR002: Deactivate a user account.</summary>
    [HttpPost("users/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateUser(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateUserCommand(id, new UpdateUserRequest(
            null, null, null, null, null, null, IsActive: false)), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>SR002: Activate a user account.</summary>
    [HttpPost("users/{id:guid}/activate")]
    public async Task<IActionResult> ActivateUser(Guid id, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new UpdateUserCommand(id, new UpdateUserRequest(
            null, null, null, null, null, null, IsActive: true)), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>SR002: Reset user password and unlock account.</summary>
    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var success = await mediator.Send(new ResetUserPasswordCommand(id, request), cancellationToken);
        return success ? Ok(new { message = "Password reset successful." }) : NotFound();
    }

    /// <summary>SR006: Create budget allocation for PR validation.</summary>
    [HttpPost("budgets")]
    public async Task<IActionResult> CreateBudget(CreateBudgetAllocationRequest request, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new CreateBudgetAllocationCommand(request), cancellationToken));
    }

    /// <summary>SR006: View budget allocations.</summary>
    [HttpGet("budgets")]
    public async Task<IActionResult> GetBudgets([FromQuery] int? fiscalYear, CancellationToken cancellationToken)
    {
        return Ok(await mediator.Send(new GetBudgetAllocationsQuery(fiscalYear), cancellationToken));
    }
}
