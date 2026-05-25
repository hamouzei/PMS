using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMS.API.Authentication;
using PMS.Application.DTO;
using PMS.Domain.Entities;
using PMS.Domain.Enums;
using PMS.Persistence;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(PMSDbContext context, IJwtTokenService tokenService) : ControllerBase
{
    // SRS Login §1.4: Max failed attempts before lockout
    private const int MaxFailedAttempts = 4;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(30);

    /// <summary>
    /// SRS Login §1.1-1.7: Authenticate user by EmployeeId + UserName + Password.
    /// Role is derived from DB, not sent by client (security fix).
    /// Implements account lockout after 4 failed attempts (SRS §1.4).
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .SingleOrDefaultAsync(value =>
                value.EmployeeId == request.EmployeeId
                && value.UserName == request.UserName
                && value.IsActive,
                cancellationToken);

        // SRS Login §1.4: Check lockout
        if (user is not null && user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
        {
            AddAudit(user.Id, "LoginBlocked", $"Account locked until {user.LockedUntil.Value:u}.");
            await context.SaveChangesAsync(cancellationToken);
            return Unauthorized(new { error = $"Account is locked. Try again after {user.LockedUntil.Value:HH:mm} UTC." });
        }

        if (user is null
            || string.IsNullOrWhiteSpace(user.PasswordHash)
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // SRS Login §1.4: Increment failed attempt counter
            if (user is not null)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= MaxFailedAttempts)
                {
                    user.LockedUntil = DateTime.UtcNow.Add(LockoutDuration);
                    AddAudit(user.Id, "AccountLocked", $"Locked after {MaxFailedAttempts} failed attempts.");
                }
                else
                {
                    AddAudit(user.Id, "LoginFailed", $"Failed attempt {user.FailedLoginAttempts} of {MaxFailedAttempts}.");
                }
                await context.SaveChangesAsync(cancellationToken);
            }

            return Unauthorized(new { error = "Invalid or inactive PAS user." });
        }

        // Reset failed attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;

        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        user.RefreshToken = Guid.NewGuid();
        user.RefreshTokenExpiresAt = refreshTokenExpiresAt;

        // SRS Login §1.6: Login audit trail
        AddAudit(user.Id, "LoginSuccess", $"User {user.UserName} logged in successfully.");
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
    [Authorize]
    public IActionResult Roles()
    {
        return Ok(Enum.GetNames<UserRole>());
    }

    private void AddAudit(Guid userId, string action, string details)
    {
        context.AuditTrails.Add(new AuditTrail
        {
            UserId = userId,
            Action = action,
            EntityName = "AppUser",
            EntityId = userId,
            Details = details
        });
    }
}
