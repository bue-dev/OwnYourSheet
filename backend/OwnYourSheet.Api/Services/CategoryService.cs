using Microsoft.EntityFrameworkCore;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.Services;

public class CategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        return await _db.Categories
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto(
                c.Id,
                c.Title,
                c.SortOrder,
                c.CreatedAt,
                c.UpdatedAt,
                c.Entries.Count
            ))
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid id)
    {
        return await _db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(
                c.Id,
                c.Title,
                c.SortOrder,
                c.CreatedAt,
                c.UpdatedAt,
                c.Entries.Count
            ))
            .FirstOrDefaultAsync();
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var maxOrder = await _db.Categories.MaxAsync(c => (int?)c.SortOrder) ?? -1;

        var category = new Category
        {
            Title = dto.Title,
            SortOrder = maxOrder + 1
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryDto(
            category.Id,
            category.Title,
            category.SortOrder,
            category.CreatedAt,
            category.UpdatedAt,
            0
        );
    }

    public async Task<CategoryDto?> UpdateAsync(Guid id, UpdateCategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return null;

        category.Title = dto.Title;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var entryCount = await _db.Entries.CountAsync(e => e.CategoryId == id);
        return new CategoryDto(
            category.Id,
            category.Title,
            category.SortOrder,
            category.CreatedAt,
            category.UpdatedAt,
            entryCount
        );
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null) return false;

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task ReorderAsync(List<ReorderItemDto> items)
    {
        foreach (var item in items)
        {
            var category = await _db.Categories.FindAsync(item.Id);
            if (category is not null)
            {
                category.SortOrder = item.SortOrder;
                category.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync();
    }
}
