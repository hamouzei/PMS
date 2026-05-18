using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace PMS.Tests;

public class SwaggerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SwaggerTests(WebApplicationFactory<Program> factory)
    {
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection",
            "Server=(localdb)\\mssqllocaldb;Database=PMS_Test;Trusted_Connection=True;TrustServerCertificate=True;");
        Environment.SetEnvironmentVariable(
            "Jwt__SigningKey",
            "test-signing-key-with-at-least-32-characters");

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration(configuration =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=PMS_Test;Trusted_Connection=True;TrustServerCertificate=True;",
                    ["Jwt:SigningKey"] = "test-signing-key-with-at-least-32-characters"
                });
            });
        });
    }

    [Fact]
    public async Task Swagger_json_exposes_pas_endpoints()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/swagger/v1/swagger.json");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("/api/store-requests", body);
        Assert.Contains("/api/receiving", body);
        Assert.Contains("/api/reports/dashboard", body);
    }
}
