using System.ComponentModel.DataAnnotations;

namespace OwnYourSheet.Api.Models;

public class Category
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string UserId { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Entry> Entries { get; set; } = new List<Entry>();
}
