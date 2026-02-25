using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Extensions;
using OwnYourSheet.Api.Services;

namespace OwnYourSheet.Api.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public class ExportImportController : ControllerBase
{
    private readonly ExportImportService _service;

    public ExportImportController(ExportImportService service)
    {
        _service = service;
    }

    [HttpGet("export")]
    public async Task<ActionResult<ExportDataDto>> Export()
    {
        return await _service.ExportAsync(User.GetUserId());
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromBody] ExportDataDto data)
    {
        await _service.ImportAsync(data, User.GetUserId());
        return Ok(new { message = "Import completed successfully" });
    }
}
