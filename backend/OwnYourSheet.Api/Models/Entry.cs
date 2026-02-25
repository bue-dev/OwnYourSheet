using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OwnYourSheet.Api.Models;

public class Entry
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    [MaxLength(128)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public EntryType EntryType { get; set; } = EntryType.Text;

    [MaxLength(50)]
    public string? Language { get; set; }

    /// <summary>
    /// Stored as JSON array: [{"name":"varName","defaultValue":"value"}]
    /// </summary>
    public string VariablesJson { get; set; } = "[]";

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(CategoryId))]
    public Category? Category { get; set; }

    // Helper (not mapped to DB)
    [NotMapped]
    public List<EntryVariable> Variables
    {
        get => System.Text.Json.JsonSerializer.Deserialize<List<EntryVariable>>(VariablesJson) ?? [];
        set => VariablesJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}
