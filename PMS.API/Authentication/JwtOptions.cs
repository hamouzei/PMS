namespace PMS.API.Authentication;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "PMS";
    public string Audience { get; set; } = "PMS.Client";
    public string SigningKey { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 120;
}
