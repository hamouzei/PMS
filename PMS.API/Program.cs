using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Newtonsoft.Json;
using PMS.API.Authentication;
using PMS.API.Filters;
using PMS.API.Middleware;
using PMS.Application;
using PMS.Persistence;
using PMS.Persistence.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureApplicationServices();
builder.Services.ConfigurePersistenceServices(builder.Configuration);
builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(options => !string.IsNullOrWhiteSpace(options.SigningKey), "JWT signing key is not configured.")
    .ValidateOnStart();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add<FluentValidationActionFilter>();
    })
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration section is missing.");
if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey))
{
    throw new InvalidOperationException("JWT signing key is not configured. Set Jwt__SigningKey or use dotnet user-secrets.");
}

// P0 Security fix: Header auth only in Development; production uses Bearer-only
var isDevelopment = builder.Environment.IsDevelopment();

const string smartAuthenticationScheme = "Smart";
var authBuilder = builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = isDevelopment ? smartAuthenticationScheme : JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = isDevelopment ? smartAuthenticationScheme : JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

// Only register HeaderAuthenticationHandler in Development
if (isDevelopment)
{
    authBuilder
        .AddPolicyScheme(smartAuthenticationScheme, smartAuthenticationScheme, options =>
        {
            options.ForwardDefaultSelector = context =>
            {
                var authorization = context.Request.Headers.Authorization.ToString();
                return authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? JwtBearerDefaults.AuthenticationScheme
                    : HeaderAuthenticationHandler.SchemeName;
            };
        })
        .AddScheme<AuthenticationSchemeOptions, HeaderAuthenticationHandler>(
            HeaderAuthenticationHandler.SchemeName,
            _ => { });
}

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularClient", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                builder.Configuration.GetValue<string>("Cors:AllowedOrigin") ?? "http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a JWT token from /api/auth/login."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            []
        }
    });
});
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

if (app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("SeedData:ApplyOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<PMSDbContext>();
    await PasSeedData.SeedAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors("AngularClient");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditUserMiddleware>();

app.MapControllers();

app.Run();

public partial class Program;
