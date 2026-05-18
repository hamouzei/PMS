namespace PMS.API.Authentication;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "PMS";
    public string Audience { get; set; } = "PMS.Client";
    public string SigningKey { get; set; } = "development-signing-key-change-before-production-32";
    public int ExpiryMinutes { get; set; } = 120;
}
