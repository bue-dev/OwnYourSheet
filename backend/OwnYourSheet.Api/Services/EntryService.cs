using Microsoft.EntityFrameworkCore;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.Services;

public class EntryService
{
    private readonly AppDbContext _db;

    public EntryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<EntryDto>> GetByCategoryAsync(Guid categoryId)
    {
        return await _db.Entries
            .Where(e => e.CategoryId == categoryId)
            .OrderBy(e => e.SortOrder)
            .Select(e => MapToDto(e))
            .ToListAsync();
    }

    public async Task<EntryDto?> GetByIdAsync(Guid id)
    {
        var entry = await _db.Entries.FindAsync(id);
        return entry is null ? null : MapToDto(entry);
    }

    public async Task<EntryDto> CreateAsync(CreateEntryDto dto)
    {
        var maxOrder = await _db.Entries
            .Where(e => e.CategoryId == dto.CategoryId)
            .MaxAsync(e => (int?)e.SortOrder) ?? -1;

        var entry = new Entry
        {
            CategoryId = dto.CategoryId,
            Title = dto.Title,
            Content = dto.Content,
            EntryType = dto.EntryType,
            Language = dto.Language,
            SortOrder = maxOrder + 1
        };

        if (dto.Variables is not null)
        {
            entry.Variables = dto.Variables
                .Select(v => new EntryVariable { Name = v.Name, DefaultValue = v.DefaultValue })
                .ToList();
        }

        _db.Entries.Add(entry);
        await _db.SaveChangesAsync();

        return MapToDto(entry);
    }

    public async Task<EntryDto?> UpdateAsync(Guid id, UpdateEntryDto dto)
    {
        var entry = await _db.Entries.FindAsync(id);
        if (entry is null) return null;

        if (dto.Title is not null) entry.Title = dto.Title;
        if (dto.Content is not null) entry.Content = dto.Content;
        if (dto.EntryType.HasValue) entry.EntryType = dto.EntryType.Value;
        if (dto.Language is not null) entry.Language = dto.Language;
        if (dto.Variables is not null)
        {
            entry.Variables = dto.Variables
                .Select(v => new EntryVariable { Name = v.Name, DefaultValue = v.DefaultValue })
                .ToList();
        }

        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(entry);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entry = await _db.Entries.FindAsync(id);
        if (entry is null) return false;

        _db.Entries.Remove(entry);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task ReorderAsync(List<ReorderItemDto> items)
    {
        foreach (var item in items)
        {
            var entry = await _db.Entries.FindAsync(item.Id);
            if (entry is not null)
            {
                entry.SortOrder = item.SortOrder;
                entry.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync();
    }

    private static EntryDto MapToDto(Entry e)
    {
        return new EntryDto(
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
        );
    }
}
