using Xunit;
using OwnYourSheet.Api.DTOs;
using OwnYourSheet.Api.Models;
using OwnYourSheet.Api.Services;
using OwnYourSheet.Tests.Helpers;

namespace OwnYourSheet.Tests.Services;

public class CategoryServiceTests
{
    private const string UserId = "test-user-1";
    private const string OtherUserId = "test-user-2";

    [Fact]
    public async Task GetAllAsync_ReturnsOnlyUserCategories()
    {
        using var db = TestDbContext.Create();
        db.Categories.AddRange(
            new Category { Title = "My Category", UserId = UserId, SortOrder = 0 },
            new Category { Title = "Other User", UserId = OtherUserId, SortOrder = 0 }
        );
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.GetAllAsync(UserId);

        Assert.Single(result);
        Assert.Equal("My Category", result[0].Title);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsSortedBySortOrder()
    {
        using var db = TestDbContext.Create();
        db.Categories.AddRange(
            new Category { Title = "Second", UserId = UserId, SortOrder = 1 },
            new Category { Title = "First", UserId = UserId, SortOrder = 0 },
            new Category { Title = "Third", UserId = UserId, SortOrder = 2 }
        );
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.GetAllAsync(UserId);

        Assert.Equal(3, result.Count);
        Assert.Equal("First", result[0].Title);
        Assert.Equal("Second", result[1].Title);
        Assert.Equal("Third", result[2].Title);
    }

    [Fact]
    public async Task GetAllAsync_IncludesEntryCount()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "With Entries", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        db.Entries.AddRange(
            new Entry { CategoryId = category.Id, UserId = UserId, Title = "E1", Content = "C1", SortOrder = 0 },
            new Entry { CategoryId = category.Id, UserId = UserId, Title = "E2", Content = "C2", SortOrder = 1 }
        );
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.GetAllAsync(UserId);

        Assert.Single(result);
        Assert.Equal(2, result[0].EntryCount);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsCategory()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "Test", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.GetByIdAsync(category.Id, UserId);

        Assert.NotNull(result);
        Assert.Equal("Test", result.Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullForOtherUser()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "Test", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.GetByIdAsync(category.Id, OtherUserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNullForNonExistent()
    {
        using var db = TestDbContext.Create();
        var service = new CategoryService(db);
        var result = await service.GetByIdAsync(Guid.NewGuid(), UserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_CreatesCategory()
    {
        using var db = TestDbContext.Create();
        var service = new CategoryService(db);

        var result = await service.CreateAsync(new CreateCategoryDto("New Category"), UserId);

        Assert.Equal("New Category", result.Title);
        Assert.Equal(0, result.SortOrder);
        Assert.Equal(0, result.EntryCount);
        Assert.Single(db.Categories);
    }

    [Fact]
    public async Task CreateAsync_AutoIncrementsSortOrder()
    {
        using var db = TestDbContext.Create();
        db.Categories.Add(new Category { Title = "Existing", UserId = UserId, SortOrder = 0 });
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.CreateAsync(new CreateCategoryDto("Second"), UserId);

        Assert.Equal(1, result.SortOrder);
    }

    [Fact]
    public async Task CreateAsync_SortOrderPerUser()
    {
        using var db = TestDbContext.Create();
        db.Categories.Add(new Category { Title = "Other", UserId = OtherUserId, SortOrder = 5 });
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.CreateAsync(new CreateCategoryDto("My First"), UserId);

        Assert.Equal(0, result.SortOrder);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesTitle()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "Old Title", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.UpdateAsync(category.Id, new UpdateCategoryDto("New Title"), UserId);

        Assert.NotNull(result);
        Assert.Equal("New Title", result.Title);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNullForOtherUser()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "Test", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.UpdateAsync(category.Id, new UpdateCategoryDto("Hacked"), OtherUserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_RemovesCategory()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "To Delete", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.DeleteAsync(category.Id, UserId);

        Assert.True(result);
        Assert.Empty(db.Categories);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalseForOtherUser()
    {
        using var db = TestDbContext.Create();
        var category = new Category { Title = "Protected", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        var result = await service.DeleteAsync(category.Id, OtherUserId);

        Assert.False(result);
        Assert.Single(db.Categories);
    }

    [Fact]
    public async Task ReorderAsync_UpdatesSortOrder()
    {
        using var db = TestDbContext.Create();
        var cat1 = new Category { Title = "A", UserId = UserId, SortOrder = 0 };
        var cat2 = new Category { Title = "B", UserId = UserId, SortOrder = 1 };
        db.Categories.AddRange(cat1, cat2);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        await service.ReorderAsync(
        [
            new ReorderItemDto(cat1.Id, 1),
            new ReorderItemDto(cat2.Id, 0)
        ], UserId);

        Assert.Equal(1, db.Categories.First(c => c.Id == cat1.Id).SortOrder);
        Assert.Equal(0, db.Categories.First(c => c.Id == cat2.Id).SortOrder);
    }

    [Fact]
    public async Task ReorderAsync_IgnoresOtherUserCategories()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Other", UserId = OtherUserId, SortOrder = 0 };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        var service = new CategoryService(db);
        await service.ReorderAsync([new ReorderItemDto(cat.Id, 99)], UserId);

        Assert.Equal(0, db.Categories.First(c => c.Id == cat.Id).SortOrder);
    }
}
