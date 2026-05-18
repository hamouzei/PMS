using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMS.API.Authorization;
using PMS.Persistence;
using PMS.Persistence.Services;

namespace PMS.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = PasRoles.PropertyAdmin)]
public class AdminController(PMSDbContext context) : ControllerBase
{
    [HttpPost("seed")]
    public async Task<IActionResult> Seed(CancellationToken cancellationToken)
    {
        await PasSeedData.SeedAsync(context, cancellationToken);
        return Ok(new { message = "Seed data is ready." });
    }
}
