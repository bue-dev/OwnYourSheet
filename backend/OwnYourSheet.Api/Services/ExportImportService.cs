using Microsoft.EntityFrameworkCore;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.Services;

public class ExportImportService
{
    private readonly AppDbContext _db;

    public ExportImportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ExportDataDto> ExportAsync()
    {
        var categories = await _db.Categories
            .Include(c => c.Entries.OrderBy(e => e.SortOrder))
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        return new ExportDataDto(
            DateTime.UtcNow,
            "1.0",
            categories.Select(c => new ExportCategoryDto(
                c.Id,
                c.Title,
                c.SortOrder,
                c.Entries.Select(e => new EntryDto(
                    e.Id,
                    e.CategoryId,
                    e.Title,
                    e.Content,
                    e.EntryType,
                    e.Language,
                    e.Variables.Select(v => new EntryVariableDto(v.Name, v.DefaultValue)).ToList(),
                    e.SortOrder,
                    e.CreatedAt,
                    e.UpdatedAt
                )).ToList()
            )).ToList()
        );
    }

    public async Task ImportAsync(ExportDataDto data)
    {
        // Clear existing data
        _db.Entries.RemoveRange(_db.Entries);
        _db.Categories.RemoveRange(_db.Categories);
        await _db.SaveChangesAsync();

        foreach (var catDto in data.Categories)
        {
            var category = new Category
            {
                Id = catDto.Id,
                Title = catDto.Title,
                SortOrder = catDto.SortOrder
            };
            _db.Categories.Add(category);

            foreach (var entryDto in catDto.Entries)
            {
                var entry = new Entry
                {
                    Id = entryDto.Id,
                    CategoryId = category.Id,
                    Title = entryDto.Title,
                    Content = entryDto.Content,
                    EntryType = entryDto.EntryType,
                    Language = entryDto.Language,
                    SortOrder = entryDto.SortOrder,
                    CreatedAt = entryDto.CreatedAt,
                    UpdatedAt = entryDto.UpdatedAt
                };
                entry.Variables = entryDto.Variables
                    .Select(v => new EntryVariable { Name = v.Name, DefaultValue = v.DefaultValue })
                    .ToList();

                _db.Entries.Add(entry);
            }
        }

        await _db.SaveChangesAsync();
    }
}
