using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authentication;
using PMS.Application.DTO;
using PMS.Domain.Enums;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(PMSDbContext context, IJwtTokenService tokenService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(value =>
                value.EmployeeId == request.EmployeeId
                && value.UserName == request.UserName
                && value.Role == request.Role
                && value.IsActive,
                cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { error = "Invalid or inactive PAS user." });
        }

        return Ok(new LoginResponse(
            "Bearer",
            request.EmployeeId,
            request.UserName,
            request.Role.ToString(),
            tokenService.CreateToken(user),
            ["Authorization: Bearer <token>"]));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            userName = User.Identity?.Name,
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            employeeId = User.FindFirstValue("employee_id"),
            roles = User.FindAll(ClaimTypes.Role).Select(claim => claim.Value)
        });
    }

    [HttpGet("roles")]
    [AllowAnonymous]
    public IActionResult Roles()
    {
        return Ok(Enum.GetNames<UserRole>());
    }
}
