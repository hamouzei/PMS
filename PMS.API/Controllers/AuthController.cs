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
            .SingleOrDefaultAsync(value =>
                value.EmployeeId == request.EmployeeId
                && value.UserName == request.UserName
                && value.Role == request.Role
                && value.IsActive,
                cancellationToken);

        if (user is null
            || string.IsNullOrWhiteSpace(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid or inactive PAS user." });
        }

        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        user.RefreshToken = Guid.NewGuid();
        user.RefreshTokenExpiresAt = refreshTokenExpiresAt;
        await context.SaveChangesAsync(cancellationToken);

        return Ok(new LoginResponse(
            "Bearer",
            request.EmployeeId,
            request.UserName,
            request.Role.ToString(),
            tokenService.CreateToken(user),
            user.RefreshToken.Value,
            refreshTokenExpiresAt,
            ["Authorization: Bearer <token>"]));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .SingleOrDefaultAsync(value =>
                value.RefreshToken == request.RefreshToken
                && value.RefreshTokenExpiresAt > DateTime.UtcNow
                && value.IsActive,
                cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { error = "Invalid or expired refresh token." });
        }

        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        user.RefreshToken = Guid.NewGuid();
        user.RefreshTokenExpiresAt = refreshTokenExpiresAt;
        await context.SaveChangesAsync(cancellationToken);

        return Ok(new LoginResponse(
            "Bearer",
            user.EmployeeId,
            user.UserName,
            user.Role.ToString(),
            tokenService.CreateToken(user),
            user.RefreshToken.Value,
            refreshTokenExpiresAt,
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
