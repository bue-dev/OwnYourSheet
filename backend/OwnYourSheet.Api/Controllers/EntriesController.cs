using Microsoft.AspNetCore.Mvc;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Services;

namespace OwnYourSheet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EntriesController : ControllerBase
{
    private readonly EntryService _service;

    public EntriesController(EntryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<EntryDto>>> GetByCategory([FromQuery] Guid categoryId)
    {
        return await _service.GetByCategoryAsync(categoryId);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EntryDto>> GetById(Guid id)
    {
        var entry = await _service.GetByIdAsync(id);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<ActionResult<EntryDto>> Create([FromBody] CreateEntryDto dto)
    {
        var entry = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EntryDto>> Update(Guid id, [FromBody] UpdateEntryDto dto)
    {
        var entry = await _service.UpdateAsync(id, dto);
        return entry is null ? NotFound() : Ok(entry);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _service.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<ReorderItemDto> items)
    {
        await _service.ReorderAsync(items);
        return NoContent();
    }
}
