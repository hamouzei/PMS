using PMS.Domain.Entities;

namespace PMS.API.Authentication;

public interface IJwtTokenService
{
    string CreateToken(AppUser user);
}
