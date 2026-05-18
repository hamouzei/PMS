using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PMS.Application.Exceptions;

namespace PMS.API.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await HandleException(context, exception);
        }
    }

    private async Task HandleException(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            BusinessRuleException => StatusCodes.Status400BadRequest,
            ValidationException => StatusCodes.Status400BadRequest,
            DbUpdateException => StatusCodes.Status409Conflict,
            UnauthorizedAccessException => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception occurred while processing {Path}.", context.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Request {Path} failed with handled error.", context.Request.Path);
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var errors = exception is ValidationException validationException
            ? validationException.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray())
            : null;

        await context.Response.WriteAsJsonAsync(new
        {
            type = "https://httpstatuses.com/" + statusCode,
            title = statusCode == StatusCodes.Status500InternalServerError ? "Unexpected server error" : "Request failed",
            status = statusCode,
            detail = exception.Message,
            errors,
            traceId = context.TraceIdentifier
        });
    }
}
