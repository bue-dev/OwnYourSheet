using Microsoft.EntityFrameworkCore;
using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Entry> Entries => Set<Entry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.SortOrder);
            entity.HasIndex(e => e.UserId);
            entity.HasMany(e => e.Entries)
                  .WithOne(e => e.Category)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Entry>(entity =>
        {
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.CategoryId, e.SortOrder });
        });
    }
}
