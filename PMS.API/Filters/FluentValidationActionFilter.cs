using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PMS.API.Filters;

public class FluentValidationActionFilter(IServiceProvider serviceProvider) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var errors = new Dictionary<string, string[]>();

        foreach (var argument in context.ActionArguments.Values.Where(value => value is not null))
        {
            var argumentType = argument!.GetType();
            var validatorType = typeof(IValidator<>).MakeGenericType(argumentType);
            var validator = serviceProvider.GetService(validatorType) as IValidator;

            if (validator is null)
            {
                continue;
            }

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

            foreach (var failure in result.Errors)
            {
                errors[failure.PropertyName] = errors.TryGetValue(failure.PropertyName, out var existing)
                    ? [.. existing, failure.ErrorMessage]
                    : [failure.ErrorMessage];
            }
        }

        if (errors.Count > 0)
        {
            var problemDetails = new ValidationProblemDetails(errors)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed"
            };
            problemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            context.Result = new BadRequestObjectResult(problemDetails);
            return;
        }

        await next();
    }
}
