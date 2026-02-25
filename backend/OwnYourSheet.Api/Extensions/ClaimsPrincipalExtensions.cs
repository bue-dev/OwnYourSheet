using System.Security.Claims;

namespace OwnYourSheet.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("oid")
            ?? user.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim not found.");
    }
}
