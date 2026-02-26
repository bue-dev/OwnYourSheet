using Xunit;
using OwnYourSheet.Api.Models;
using OwnYourSheet.Api.Services;
using OwnYourSheet.Tests.Helpers;

namespace OwnYourSheet.Tests.Services;

public class SearchServiceTests
{
    private const string UserId = "test-user-1";
    private const string OtherUserId = "test-user-2";

    [Fact]
    public async Task SearchAsync_FindsByTitle()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Docker Commands", Content = "docker ps", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("Docker", UserId);

        Assert.Single(result);
        Assert.Equal("Docker Commands", result[0].Title);
    }

    [Fact]
    public async Task SearchAsync_FindsByContent()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Command", Content = "kubectl get pods", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("kubectl", UserId);

        Assert.Single(result);
        Assert.Equal("Command", result[0].Title);
    }

    [Fact]
    public async Task SearchAsync_CaseInsensitive()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Git Commands", Content = "git push", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("GIT", UserId);

        Assert.Single(result);
    }

    [Fact]
    public async Task SearchAsync_ExcludesOtherUserEntries()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.AddRange(
            new Entry { CategoryId = cat.Id, UserId = UserId, Title = "My Secret", Content = "C", SortOrder = 0 },
            new Entry { CategoryId = cat.Id, UserId = OtherUserId, Title = "Their Secret", Content = "C", SortOrder = 0 }
        );
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("Secret", UserId);

        Assert.Single(result);
        Assert.Equal("My Secret", result[0].Title);
    }

    [Fact]
    public async Task SearchAsync_ReturnsEmptyForNoMatch()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Something", Content = "Else", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("nonexistent", UserId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task SearchAsync_IncludesCategoryTitle()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "DevOps", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        db.Entries.Add(new Entry
        {
            CategoryId = cat.Id, UserId = UserId,
            Title = "Deploy", Content = "az deploy", SortOrder = 0
        });
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("Deploy", UserId);

        Assert.Single(result);
        Assert.Equal("DevOps", result[0].CategoryTitle);
    }

    [Fact]
    public async Task SearchAsync_LimitsTo50Results()
    {
        using var db = TestDbContext.Create();
        var cat = new Category { Title = "Cat", UserId = UserId, SortOrder = 0 };
        db.Categories.Add(cat);
        for (int i = 0; i < 60; i++)
        {
            db.Entries.Add(new Entry
            {
                CategoryId = cat.Id, UserId = UserId,
                Title = $"Match {i}", Content = "C", SortOrder = i
            });
        }
        await db.SaveChangesAsync();

        var service = new SearchService(db);
        var result = await service.SearchAsync("Match", UserId);

        Assert.Equal(50, result.Count);
    }
}
