using Xunit;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;
using OwnYourSheet.Api.Services;
using OwnYourSheet.Tests.Helpers;

namespace OwnYourSheet.Tests.Services;

public class EntryServiceTests
{
    private const string UserId = "test-user-1";
    private const string OtherUserId = "test-user-2";

    private static Category CreateCategory(string userId = "test-user-1") =>
        new() { Title = "Test Category", UserId = userId, SortOrder = 0 };

    [Fact]
    public async Task GetByCategoryAsync_ReturnsOnlyUserEntries()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        db.Entries.AddRange(
            new Entry { CategoryId = cat.Id, UserId = UserId, Title = "Mine", Content = "C", SortOrder = 0 },
            new Entry { CategoryId = cat.Id, UserId = OtherUserId, Title = "Other", Content = "C", SortOrder = 0 }
        );
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.GetByCategoryAsync(cat.Id, UserId);

        Assert.Single(result);
        Assert.Equal("Mine", result[0].Title);
    }

    [Fact]
    public async Task GetByCategoryAsync_ReturnsSortedBySortOrder()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        db.Entries.AddRange(
            new Entry { CategoryId = cat.Id, UserId = UserId, Title = "Second", Content = "C", SortOrder = 1 },
            new Entry { CategoryId = cat.Id, UserId = UserId, Title = "First", Content = "C", SortOrder = 0 }
        );
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.GetByCategoryAsync(cat.Id, UserId);

        Assert.Equal("First", result[0].Title);
        Assert.Equal("Second", result[1].Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsEntry()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "Test", Content = "Body", SortOrder = 0 };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.GetByIdAsync(entry.Id, UserId);

        Assert.NotNull(result);
        Assert.Equal("Test", result.Title);
        Assert.Equal("Body", result.Content);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullForOtherUser()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "Private", Content = "C", SortOrder = 0 };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.GetByIdAsync(entry.Id, OtherUserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_CreatesEntry()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var dto = new CreateEntryDto(cat.Id, "New Entry", "Content text", EntryType.Text);
        var result = await service.CreateAsync(dto, UserId);

        Assert.Equal("New Entry", result.Title);
        Assert.Equal("Content text", result.Content);
        Assert.Equal(EntryType.Text, result.EntryType);
        Assert.Equal(0, result.SortOrder);
        Assert.Single(db.Entries);
    }

    [Fact]
    public async Task CreateAsync_CreatesCodeEntry()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var dto = new CreateEntryDto(cat.Id, "Code Snippet", "console.log('hi')", EntryType.Code, "javascript");
        var result = await service.CreateAsync(dto, UserId);

        Assert.Equal(EntryType.Code, result.EntryType);
        Assert.Equal("javascript", result.Language);
    }

    [Fact]
    public async Task CreateAsync_WithVariables()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var variables = new List<EntryVariableDto>
        {
            new("name", "World"),
            new("greeting", "Hello")
        };
        var dto = new CreateEntryDto(cat.Id, "Template", "{{greeting}} {{name}}", EntryType.Prompt, Variables: variables);
        var result = await service.CreateAsync(dto, UserId);

        Assert.Equal(2, result.Variables.Count);
        Assert.Equal("name", result.Variables[0].Name);
        Assert.Equal("World", result.Variables[0].DefaultValue);
    }

    [Fact]
    public async Task CreateAsync_AutoIncrementsSortOrder()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        db.Entries.Add(new Entry { CategoryId = cat.Id, UserId = UserId, Title = "E1", Content = "C", SortOrder = 0 });
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.CreateAsync(new CreateEntryDto(cat.Id, "E2", "C"), UserId);

        Assert.Equal(1, result.SortOrder);
    }

    [Fact]
    public async Task UpdateAsync_PartialUpdate()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Original", Content = "Original Content",
            EntryType = EntryType.Text, SortOrder = 0
        };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.UpdateAsync(entry.Id, new UpdateEntryDto(Title: "Updated"), UserId);

        Assert.NotNull(result);
        Assert.Equal("Updated", result.Title);
        Assert.Equal("Original Content", result.Content);
        Assert.Equal(EntryType.Text, result.EntryType);
    }

    [Fact]
    public async Task UpdateAsync_FullUpdate()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Old", Content = "Old", EntryType = EntryType.Text, SortOrder = 0
        };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.UpdateAsync(entry.Id,
            new UpdateEntryDto("New", "New Content", EntryType.Code, "csharp"), UserId);

        Assert.NotNull(result);
        Assert.Equal("New", result.Title);
        Assert.Equal("New Content", result.Content);
        Assert.Equal(EntryType.Code, result.EntryType);
        Assert.Equal("csharp", result.Language);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNullForOtherUser()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "T", Content = "C", SortOrder = 0 };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.UpdateAsync(entry.Id, new UpdateEntryDto(Title: "Hacked"), OtherUserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_RemovesEntry()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "T", Content = "C", SortOrder = 0 };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.DeleteAsync(entry.Id, UserId);

        Assert.True(result);
        Assert.Empty(db.Entries);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalseForOtherUser()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var entry = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "T", Content = "C", SortOrder = 0 };
        db.Entries.Add(entry);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        var result = await service.DeleteAsync(entry.Id, OtherUserId);

        Assert.False(result);
        Assert.Single(db.Entries);
    }

    [Fact]
    public async Task ReorderAsync_UpdatesSortOrder()
    {
        using var db = TestDbContext.Create();
        var cat = CreateCategory();
        db.Categories.Add(cat);
        var e1 = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "A", Content = "C", SortOrder = 0 };
        var e2 = new Entry { CategoryId = cat.Id, UserId = UserId, Title = "B", Content = "C", SortOrder = 1 };
        db.Entries.AddRange(e1, e2);
        await db.SaveChangesAsync();

        var service = new EntryService(db);
        await service.ReorderAsync(
        [
            new ReorderItemDto(e1.Id, 1),
            new ReorderItemDto(e2.Id, 0)
        ], UserId);

        Assert.Equal(1, db.Entries.First(e => e.Id == e1.Id).SortOrder);
        Assert.Equal(0, db.Entries.First(e => e.Id == e2.Id).SortOrder);
    }
}
