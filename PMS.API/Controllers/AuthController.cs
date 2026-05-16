using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMS.Application.DTO;
using PMS.Domain.Enums;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<LoginResponse> Login(LoginRequest request)
    {
        return Ok(new LoginResponse(
            "Header",
            request.EmployeeId,
            request.UserName,
            request.Role.ToString(),
            ["X-User-Role", "X-User-Name", "X-Employee-Id", "X-User-Id"]));
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
