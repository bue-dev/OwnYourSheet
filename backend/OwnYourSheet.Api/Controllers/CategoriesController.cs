using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Extensions;
using OwnYourSheet.Api.Services;

namespace OwnYourSheet.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _service;

    public CategoriesController(CategoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        return await _service.GetAllAsync(User.GetUserId());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> GetById(Guid id)
    {
        var category = await _service.GetByIdAsync(id, User.GetUserId());
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var category = await _service.CreateAsync(dto, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _service.UpdateAsync(id, dto, User.GetUserId());
        return category is null ? NotFound() : Ok(category);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _service.DeleteAsync(id, User.GetUserId()) ? NoContent() : NotFound();
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<ReorderItemDto> items)
    {
        await _service.ReorderAsync(items, User.GetUserId());
        return NoContent();
    }
}
