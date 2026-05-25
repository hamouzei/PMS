using System.Security.Claims;
using PMS.Persistence;

namespace PMS.API.Middleware;

/// <summary>
/// Injects the current authenticated user into PMSDbContext.CurrentUser
/// so that ApplyAuditFields can populate CreatedBy/UpdatedBy automatically.
/// </summary>
public class AuditUserMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, PMSDbContext dbContext)
    {
        var userName = context.User?.FindFirst(ClaimTypes.Name)?.Value;
        if (!string.IsNullOrEmpty(userName))
        {
            dbContext.CurrentUser = userName;
        }

        await next(context);
    }
}
