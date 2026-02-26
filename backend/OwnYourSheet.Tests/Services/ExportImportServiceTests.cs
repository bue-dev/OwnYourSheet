using Xunit;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;
using OwnYourSheet.Api.Services;
using OwnYourSheet.Tests.Helpers;

namespace OwnYourSheet.Tests.Services;

public class ExportImportServiceTests
{
    private const string UserId = "test-user-1";
    private const string OtherUserId = "test-user-2";

    [Fact]
    public async Task ExportAsync_ExportsAllUserData()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat1", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Entry1", Content = "Content1",
            EntryType = EntryType.Code, Language = "python",
            SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new ExportImportService(db);
        var result = await service.ExportAsync(UserId);

        Assert.Equal("1.0", result.Version);
        Assert.Single(result.Categories);
        Assert.Equal("Cat1", result.Categories[0].Title);
        Assert.Single(result.Categories[0].Entries);
        Assert.Equal("Entry1", result.Categories[0].Entries[0].Title);
        Assert.Equal(EntryType.Code, result.Categories[0].Entries[0].EntryType);
    }

    [Fact]
    public async Task ExportAsync_ExcludesOtherUserData()
    {
        using var db = TestDbContext.Create();
        db.Categories.AddRange(
            new Category { Title = "Mine", UserId = UserId, SortOrder = 0 },
            new Category { Title = "Theirs", UserId = OtherUserId, SortOrder = 0 }
        );
        await db.SaveChangesAsync();

        var service = new ExportImportService(db);
        var result = await service.ExportAsync(UserId);

        Assert.Single(result.Categories);
        Assert.Equal("Mine", result.Categories[0].Title);
    }

    [Fact]
    public async Task ExportAsync_EmptyExportForNewUser()
    {
        using var db = TestDbContext.Create();
        var service = new ExportImportService(db);
        var result = await service.ExportAsync(UserId);

        Assert.Empty(result.Categories);
        Assert.Equal("1.0", result.Version);
    }

    [Fact]
    public async Task ImportAsync_ImportsData()
    {
        using var db = TestDbContext.Create();
        var catId = Guid.NewGuid();
        var entryId = Guid.NewGuid();

        var data = new ExportDataDto(
            DateTime.UtcNow,
            "1.0",
            [
                new ExportCategoryDto(catId, "Imported Cat", 0,
                [
                    new EntryDto(entryId, catId, "Imported Entry", "Content",
                        EntryType.Text, null, [], 0, DateTime.UtcNow, DateTime.UtcNow)
                ])
            ]
        );

        var service = new ExportImportService(db);
        await service.ImportAsync(data, UserId);

        Assert.Single(db.Categories);
        Assert.Equal("Imported Cat", db.Categories.First().Title);
        Assert.Equal(UserId, db.Categories.First().UserId);
        Assert.Single(db.Entries);
        Assert.Equal("Imported Entry", db.Entries.First().Title);
    }

    [Fact]
    public async Task ImportAsync_ClearsExistingUserData()
    {
        using var db = TestDbContext.Create();
        var existingCat = new Category { Title = "Old", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(existingCat);
        db.Entries.Add(new Entry
        {
            CategoryId = existingCat.Id, UserId = UserId,
            Title = "Old Entry", Content = "Old", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var data = new ExportDataDto(DateTime.UtcNow, "1.0",
        [
            new ExportCategoryDto(Guid.NewGuid(), "New", 0, [])
        ]);

        var service = new ExportImportService(db);
        await service.ImportAsync(data, UserId);

        Assert.Single(db.Categories);
        Assert.Equal("New", db.Categories.First().Title);
        Assert.Empty(db.Entries);
    }

    [Fact]
    public async Task ImportAsync_DoesNotAffectOtherUsers()
    {
        using var db = TestDbContext.Create();
        var otherCat = new Category { Title = "Other", UserId = OtherUserId, SortOrder = 0 };
        db.Categories.Add(otherCat);
        await db.SaveChangesAsync();

        var data = new ExportDataDto(DateTime.UtcNow, "1.0",
        [
            new ExportCategoryDto(Guid.NewGuid(), "Mine", 0, [])
        ]);

        var service = new ExportImportService(db);
        await service.ImportAsync(data, UserId);

        Assert.Equal(2, db.Categories.Count());
        Assert.Contains(db.Categories, c => c.Title == "Other" && c.UserId == OtherUserId);
    }

    [Fact]
    public async Task RoundTrip_ExportThenImport()
    {
        var dbName = Guid.NewGuid().ToString();

        // Create data and export
        ExportDataDto exported;
        using (var db = TestDbContext.Create(dbName))
        {
            var cat = new Category { Title = "Roundtrip", UserId = UserId, SortOrder = 0 };
            db.Categories.Add(cat);
            db.Entries.AddRange(
                new Entry { CategoryId = cat.Id, UserId = UserId, Title = "E1", Content = "C1", EntryType = EntryType.Code, Language = "js", SortOrder = 0 },
                new Entry { CategoryId = cat.Id, UserId = UserId, Title = "E2", Content = "C2", EntryType = EntryType.Prompt, SortOrder = 1 }
            );
            await db.SaveChangesAsync();

            var service = new ExportImportService(db);
            exported = await service.ExportAsync(UserId);
        }

        // Import into fresh context
        using (var db = TestDbContext.Create())
        {
            var service = new ExportImportService(db);
            await service.ImportAsync(exported, UserId);

            Assert.Single(db.Categories);
            Assert.Equal("Roundtrip", db.Categories.First().Title);
            Assert.Equal(2, db.Entries.Count());
        }
    }
}
