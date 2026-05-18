using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace PMS.Tests;

public class SwaggerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public SwaggerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
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
