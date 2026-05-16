using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using PMS.Domain.Enums;

namespace PMS.API.Authentication;

public class HeaderAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Header";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-User-Role", out var roleHeader))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (!Enum.TryParse<UserRole>(roleHeader.ToString(), ignoreCase: true, out var role))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid X-User-Role header."));
        }

        var userId = Request.Headers.TryGetValue("X-User-Id", out var userIdHeader)
            ? userIdHeader.ToString()
            : string.Empty;
        var employeeId = Request.Headers.TryGetValue("X-Employee-Id", out var employeeHeader)
            ? employeeHeader.ToString()
            : userId;
        var userName = Request.Headers.TryGetValue("X-User-Name", out var userNameHeader)
            ? userNameHeader.ToString()
            : employeeId;

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.Role, role.ToString()),
            new("employee_id", employeeId)
        };

        if (Guid.TryParse(userId, out var parsedUserId))
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, parsedUserId.ToString()));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
