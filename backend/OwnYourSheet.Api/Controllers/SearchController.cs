using Microsoft.AspNetCore.Mvc;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Services;

namespace OwnYourSheet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly SearchService _service;

    public SearchController(SearchService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<SearchResultDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(new List<SearchResultDto>());

        return await _service.SearchAsync(q);
    }
}
