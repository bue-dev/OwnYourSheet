using Microsoft.EntityFrameworkCore;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.DTOs;

namespace OwnYourSheet.Api.Services;

public class SearchService
{
    private readonly AppDbContext _db;

    public SearchService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SearchResultDto>> SearchAsync(string query, string userId)
    {
        var lowerQuery = query.ToLower();

        return await _db.Entries
            .Include(e => e.Category)
            .Where(e =>
                e.UserId == userId &&
                (e.Title.ToLower().Contains(lowerQuery) ||
                e.Content.ToLower().Contains(lowerQuery)))
            .OrderBy(e => e.Title)
            .Take(50)
            .Select(e => new SearchResultDto(
                e.Id,
                e.Title,
                e.Content,
                e.EntryType,
                e.Language,
                e.CategoryId,
                e.Category!.Title
            ))
            .ToListAsync();
    }
}
